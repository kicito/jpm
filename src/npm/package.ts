/* eslint-disable @typescript-eslint/no-non-null-assertion */
import decompress from 'decompress';
import fetch from 'node-fetch';
import { tmpdir } from 'node:os';
import { join, basename, extname, resolve } from 'node:path';
import semver from 'semver';
import { copyJARToDir, download } from '../downloader';
import { ERR_TARGET_NOT_JPM_PACKAGE, errorFileNotFound } from '../errors';
import { mkdirIfNotExist } from '../fs';
import { existsSync, symlinkSync, rmSync } from 'node:fs';
import { Project } from '../mvn';
import PackageJSON from '../packageJSON';
import type { JSONSchemaForNPMPackageJsonWithJolieSPackageManager } from '../packageJSON/types';

enum TargetType {
  LOCAL_FOLDER,
  LOCAL_TGZ,
  REMOTE,
  NPM,
}

/**
 * Package represent a npm Package object
 *
 * @class Package
 */
class Package {
  /**
   * package name
   *
   * @type {string}
   * @memberof Package
   */
  packageName: string;

  /**
   * target location where to look for packages
   *
   * @type {string}
   * @memberof Package
   */
  target: string;

  /**
   * type of the Package
   *
   * @type {TargetType}
   * @memberof Package
   */
  type: TargetType;

  /**
   * Meta data content from the registry
   *
   * @type {Record<string, unknown>}
   * @memberof Package
   */
  meta?: Record<string, unknown>;

  static jpmTmpDir = join(tmpdir(), 'jpm');

  static resolveTargetType(target: string): TargetType {
    if (existsSync(target)) {
      if (target.endsWith('tgz')) {
        return TargetType.LOCAL_TGZ;
      } else {
        return TargetType.LOCAL_FOLDER;
      }
    } else if (target.startsWith('http')) {
      return TargetType.REMOTE;
    } else {
      return TargetType.NPM;
    }
  }

  constructor(target: string) {
    if (existsSync(target)) {
      this.packageName = basename(target, extname(target));
      this.target = target;
    } else {
      if (target.includes('@')) {
        const splitIndex = target.lastIndexOf('@');
        this.packageName = target.slice(0, splitIndex);
        if (this.packageName === '') {
          // check if the version is specified, if not, assign 'latest'
          // eg. jpm install @jolie/websockets to jpm install @jolie/websockets@latest
          this.packageName = target.slice(splitIndex);
          this.target = 'latest';
        } else {
          this.target = target.slice(splitIndex + 1);
        }
      } else {
        this.packageName = target;
        this.target = 'latest';
      }
    }
    this.type = Package.resolveTargetType(this.target);
  }

  /**
   * Get url of the meta data of the package in registry
   *
   * @param {string} [prefix='https://registry.npmjs.com']
   * @return {string}
   * @memberof Package
   */
  #getMetaDataURL(prefix = 'https://registry.npmjs.com'): string {
    return `${prefix}/${this.packageName}`;
  }

  /**
   * Get url of the tar file in registry
   *
   * @param {string} [prefix='https://registry.npmjs.com']
   * @return {string}
   * @memberof Package
   */
  #getTarDataURL(prefix = 'https://registry.npmjs.com'): string {
    return `${prefix}/${this.packageName}/-/${this.#tarBallName()}-${
      this.target
    }.tgz`;
  }

  /**
   * Get tarball file name in registry
   *
   * @param {string} [prefix='https://registry.npmjs.com']
   * @return {string}
   * @memberof Package
   */
  #tarBallName(): string {
    return this.packageName.includes('/')
      ? this.packageName.split('/')[1]!
      : this.packageName;
  }

  async #getDependenciesFromNPM(): Promise<(Package | Project)[]> {
    const res = [] as (Package | Project)[];

    this.meta = this.meta
      ? this.meta
      : await (await fetch(this.#getMetaDataURL())).json();
    if (!semver.valid(this.target)) {
      this.target = (this.meta!['dist-tags']! as Record<string, string>)[
        this.target
      ]!;
    }

    if (
      (this.meta!['versions'] as Record<string, unknown>)[
        this.target
      ] as JSONSchemaForNPMPackageJsonWithJolieSPackageManager
    ) {
      const jpmPackage = (this.meta!['versions'] as Record<string, unknown>)[
        this.target
      ] as JSONSchemaForNPMPackageJsonWithJolieSPackageManager;
      if (jpmPackage.jolie) {
        if (jpmPackage.jolie?.maven?.dependencies) {
          Object.keys(
            jpmPackage.jolie!.maven!.dependencies as Record<string, unknown>
          ).forEach((key) => {
            res.push(
              new Project(
                key + '@' + jpmPackage.jolie!.maven!.dependencies![key]
              )
            );
          });
        }
        if (jpmPackage.jolie?.maven?.indirectDependencies) {
          Object.keys(
            jpmPackage.jolie.maven.indirectDependencies as Record<
              string,
              unknown
            >
          ).forEach((key) => {
            res.push(
              new Project(
                key + '@' + jpmPackage.jolie!.maven!.indirectDependencies![key]
              )
            );
          });
        }
        if (jpmPackage.jolie.dependencies) {
          Object.keys(
            jpmPackage.jolie.dependencies as Record<string, unknown>
          ).forEach((key) => {
            res.push(
              new Package(key + '@' + jpmPackage.jolie!.dependencies![key])
            );
          });
        }
      } else {
        throw ERR_TARGET_NOT_JPM_PACKAGE;
      }
    }
    return res;
  }

  /**
   * Get list of dependency this package needs
   *
   * @returns {Promise<(Package | Project)[]>} list of packages or artifacts
   * @throws {ERR_TARGET_NOT_JPM_PACKAGE} if current Package instance is not valid
   */
  async getDependencies(): Promise<(Package | Project)[]> {
    switch (this.type) {
      case TargetType.NPM:
        return this.#getDependenciesFromNPM();
      case TargetType.LOCAL_FOLDER: {
        // do nothing since we are just going to create a link
        return [];
      }
      case TargetType.LOCAL_TGZ: {
        // read from tgz
        const tmpDir = join(Package.jpmTmpDir, `${this.target}`);
        await decompress(this.target, tmpDir, { strip: 1 });
        const packageJSON = new PackageJSON(join(tmpDir, 'packages'));
        return [
          ...packageJSON.getJPMDependencies(),
          ...packageJSON.getMVNDependencies(),
        ];
      }
      case TargetType.REMOTE:
        throw ERR_TARGET_NOT_JPM_PACKAGE;
      default:
        return [];
    }
  }

  /**
   * download packages to the `packages` directory. The transfer method is determine by the package type.
   *  npm: fetch data from npm registry and download/extract tarball to packages directory
   *  local_folder: create symlink pointing to the directory
   *  local_tgz: unzip file to packages directory
   *  remote: download and extract to package directory
   *
   * @param dist directory destination
   * @param libDir lib directory
   * @param pkg package instance
   * @returns
   */
  static async installPackage(dist: string, libDir: string, pkg: Package) {
    const packageDir = join(dist, 'packages', pkg.packageName);
    console.log('Install ', pkg.toString(), 'to', packageDir);

    switch (pkg.type) {
      case TargetType.NPM: {
        mkdirIfNotExist(packageDir);
        mkdirIfNotExist(Package.jpmTmpDir);
        const tmpDir = join(
          Package.jpmTmpDir,
          `${pkg.#tarBallName()}-${pkg.target}.tgz`
        );
        if (!existsSync(tmpDir)) {
          await download(pkg.#getTarDataURL(), tmpDir);
        }

        await decompress(tmpDir, packageDir, { strip: 1 });
        await copyJARToDir(packageDir, libDir);
        return;
      }
      case TargetType.LOCAL_FOLDER: {
        const linkTarget = resolve(pkg.target);
        if (!existsSync(linkTarget)) {
          throw errorFileNotFound(linkTarget);
        }
        mkdirIfNotExist(join(dist, 'packages'));
        if (existsSync(packageDir)) {
          rmSync(packageDir);
          console.log('Overriding', packageDir);
        }
        symlinkSync(linkTarget, packageDir);
        return;
      }
      case TargetType.LOCAL_TGZ: {
        mkdirIfNotExist(packageDir);
        // read from tgz
        const tmpDir = join(Package.jpmTmpDir, `${pkg.target}`);
        if (!existsSync(tmpDir)) {
          await decompress(tmpDir, packageDir, { strip: 1 });
        } else {
          await decompress(pkg.target, packageDir, { strip: 1 });
        }
        return;
      }
      case TargetType.REMOTE: {
        mkdirIfNotExist(packageDir);
        mkdirIfNotExist(Package.jpmTmpDir);
        const tmpDir = join(Package.jpmTmpDir, pkg.target);
        if (!existsSync(tmpDir)) {
          await download(pkg.target, tmpDir);
        }

        await decompress(tmpDir, packageDir, { strip: 1 });
        await copyJARToDir(packageDir, libDir);
      }
    }
  }

  /**
   * Download list of package and it's depenencies to `dist` package
   * @param dist directory destination
   * @param pkg package to install
   * @param deps dependencies
   */
  static async installPackageAndDependencies(
    dist: string,
    pkg: Package,
    deps: Package[]
  ) {
    const libDir = join(dist, 'lib');
    mkdirIfNotExist(libDir);

    Package.installPackage(dist, libDir, pkg);

    for (const dep of deps) {
      const packageDir = join(dist, 'packages', pkg.packageName);
      Package.installPackage(packageDir, libDir, dep);
    }
  }

  toString(): string {
    return `${this.packageName}@${this.target}`;
  }
}

export default Package;
