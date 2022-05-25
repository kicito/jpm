import fetch from 'node-fetch'
import { Artifact } from '../mvn'
import type { JSONSchemaForNPMPackageJsonWithJolieSPackageManager } from '../packageJSON/types'
import { basename, join } from 'node:path'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { download } from '../downloader'
import { tmpdir } from 'node:os'
import decompress from 'decompress'
import glob from 'glob'
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

  #getMetaDataURL(prefix = 'https://registry.npmjs.com'): string {
    return `${prefix}/${this.packageName}`
  }

  #getTarDataURL(prefix = 'https://registry.npmjs.com'): string {
    return `${prefix}/${this.packageName}/-/${this.packageName}-${this.version}.tgz`
  }

  async getDependencies(): Promise<(Package | Artifact)[]> {
    const res = [this] as (Package | Artifact)[]
    const response = await fetch(this.#getMetaDataURL())
    this.meta = await response.json()
    if (!semver.valid(this.version)) {
      this.version = (this.meta!['dist-tags']! as Record<string, string>)[this.version]!
    }
    if (((this.meta!['versions'] as Record<string, unknown>)[this.version] as JSONSchemaForNPMPackageJsonWithJolieSPackageManager)) {
      const jpmPackage = ((this.meta!['versions'] as Record<string, unknown>)[this.version] as JSONSchemaForNPMPackageJsonWithJolieSPackageManager)
      if (jpmPackage.jpm) {
        if (jpmPackage.jpm.mavenDependencies) {
          Object.keys(jpmPackage.jpm.mavenDependencies as Object).forEach((key) => {
            res.push(new Artifact(key + '@' + jpmPackage.jpm.mavenDependencies![key]))
          })
        }
        if (jpmPackage.jpm.mavenIndirectDependencies) {
          Object.keys(jpmPackage.jpm.mavenIndirectDependencies as Object).forEach((key) => {
            res.push(new Artifact(key + '@' + jpmPackage.jpm.mavenIndirectDependencies![key]))
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
    const packageRootDir = join(dist, 'package')
    const libDir = join(dist, 'lib')
    const jpmTmpDir = join(tmpdir(), 'jpm')
    if (!existsSync(packageRootDir)) {
      mkdirSync(packageRootDir, { recursive: true })
    }
    if (!existsSync(jpmTmpDir)) {
      mkdirSync(jpmTmpDir, { recursive: true })
    }
    for (const dep of deps) {
      const tmpDir = join(jpmTmpDir, `${dep.packageName}-${dep.version}.tgz`)
      await download(dep.#getTarDataURL(), tmpDir)
      const packageDir = join(packageRootDir, dep.packageName)
      await decompress(tmpDir, packageDir, { strip: 1 })
      await new Promise<void>((resolve, reject) => {
        glob(join(packageDir, '**/*.jar'), (err, matches) => {
          if (err) {
            return reject(err)
          }
          if (!existsSync(libDir)) {
            mkdirSync(libDir, { recursive: true })
          }
          for (const match of matches) {
            copyFileSync(match, join(libDir, basename(match)))
          }
          resolve()
        })
      })
    }
  }

  toString(): string {
    return `${this.packageName} @${this.version} `
  }
}

export default Package
