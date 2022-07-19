import fetch from 'node-fetch'
import { Project } from '../mvn'
import type { JSONSchemaForNPMPackageJsonWithJolieSPackageManager } from '../packageJSON/types'
import { join } from 'node:path'
import { mkdirIfNotExist } from '../fs'
import { download, copyJARToDir } from '../downloader'
import { tmpdir } from 'node:os'
import decompress from 'decompress'
import semver from 'semver'
import { ERR_TARGET_NOT_JPM_PACKAGE } from '../errors'

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
  packageName: string

  /**
  * version
  *
  * @type {string}
  * @memberof Package
  */
  version: string

  /**
   * Meta data content from the registry
   *
   * @type {Record<string, unknown>}
   * @memberof Package
   */
  meta?: Record<string, unknown>

  constructor(target: string) {
    if (target.includes('@')) {
      const splitIndex = target.lastIndexOf('@')
      this.packageName = target.slice(0, splitIndex)
      if (this.packageName === '') {
        // package name gets priority eg. jpm install @jolie/websockets to jpm install @jolie/websockets@latest
        this.packageName = target.slice(splitIndex)
        this.version = 'latest'
      } else {
        this.version = target.slice(splitIndex + 1)
      }
    } else {
      this.packageName = target
      this.version = 'latest'
    }
  }

  /**
   * Get url of the meta data of the package in registry
   *
   * @param {string} [prefix='https://registry.npmjs.com']
   * @return {string} 
   * @memberof Package
   */
  #getMetaDataURL(prefix = 'https://registry.npmjs.com'): string {
    return `${prefix}/${this.packageName}`
  }

  /**
   * Get url of the tar file in registry
   *
   * @param {string} [prefix='https://registry.npmjs.com']
   * @return {string} 
   * @memberof Package
   */
  #getTarDataURL(prefix = 'https://registry.npmjs.com'): string {
    return `${prefix}/${this.packageName}/-/${this.#tarBallName()}-${this.version}.tgz`
  }

  /**
   * Get tarball file name in registry
   *
   * @param {string} [prefix='https://registry.npmjs.com']
   * @return {string} 
   * @memberof Package
   */
  #tarBallName(): string {
    return this.packageName.includes('/') ? this.packageName.split('/')[1]! : this.packageName
  }

  /**
   * Get list of dependency this package needs
   * 
   * @returns {Promise<(Package | Project)[]>} list of packages or artifacts
   * @throws {ERR_TARGET_NOT_JPM_PACKAGE} if current Package instance is not valid
   */
  async getDependencies(): Promise<(Package | Project)[]> {
    const res = [this] as (Package | Project)[]
    this.meta = this.meta ? this.meta : await (await fetch(this.#getMetaDataURL())).json()
    if (!semver.valid(this.version)) {
      this.version = (this.meta!['dist-tags']! as Record<string, string>)[this.version]!
    }

    if (((this.meta!['versions'] as Record<string, unknown>)[this.version] as JSONSchemaForNPMPackageJsonWithJolieSPackageManager)) {
      const jpmPackage = ((this.meta!['versions'] as Record<string, unknown>)[this.version] as JSONSchemaForNPMPackageJsonWithJolieSPackageManager)
      if (jpmPackage.jpm) {
        if (jpmPackage.jpm.mavenDependencies) {
          Object.keys(jpmPackage.jpm.mavenDependencies as Object).forEach((key) => {
            res.push(new Project(key + '@' + jpmPackage.jpm.mavenDependencies![key]))
          })
        }
        if (jpmPackage.jpm.mavenIndirectDependencies) {
          Object.keys(jpmPackage.jpm.mavenIndirectDependencies as Object).forEach((key) => {
            res.push(new Project(key + '@' + jpmPackage.jpm.mavenIndirectDependencies![key]))
          })
        }
        if (jpmPackage.jpm.jolieDependencies) {
          Object.keys(jpmPackage.jpm.mavenDependencies as Object).forEach((key) => {
            res.push(new Package(key + '@' + jpmPackage.jpm.mavenDependencies![key]))
          })
        }
      } else {
        throw ERR_TARGET_NOT_JPM_PACKAGE
      }
    }

    return res
  }

  static async downloadPackageAndDependencies(dist: string, deps: Package[]) {
    const packageRootDir = join(dist, 'packages')
    const libDir = join(dist, 'lib')
    const jpmTmpDir = join(tmpdir(), 'jpm')
    mkdirIfNotExist(packageRootDir)
    mkdirIfNotExist(jpmTmpDir)
    for (const dep of deps) {
      const tmpDir = join(jpmTmpDir, `${dep.#tarBallName()}-${dep.version}.tgz`)
      await download(dep.#getTarDataURL(), tmpDir)
      const packageDir = join(packageRootDir, dep.packageName)
      await decompress(tmpDir, packageDir, { strip: 1 })
      await copyJARToDir(packageDir, libDir)
    }
  }

  toString(): string {
    return `${this.packageName} @${this.version} `
  }
}

export default Package
