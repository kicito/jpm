import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { JSONSchemaForNPMPackageJsonWithJolieSPackageManager } from './types'
import { ERR_JPM_EXISTS } from '../errors'
import Project from '../mvn/project'
import { Package } from '../npm'

/**
 * A class representing package.json content
 * 
 * @export
 * @class PackageJSON
 */
export default class PackageJSON {


  /**
   * Path to the package.json file
   *
   * @type {string}
   * @memberof PackageJSON
   */
  path: string


  /**
   * Virtual content in the corresponding package.json
   *
   * @type {JSONSchemaForNPMPackageJsonWithJolieSPackageManager}
   * @memberof PackageJSON
   */
  content: JSONSchemaForNPMPackageJsonWithJolieSPackageManager


  /**
   * Creates an instance of PackageJSON.
   * @param {string} [path='.'] directory where package.json reside, appends "/package.json" if the input is not package.json
   * @memberof PackageJSON
   */
  constructor(path: string = '.') {
    this.path = path.endsWith('package.json') ? path : resolve(path, 'package.json')
    this.content = <JSONSchemaForNPMPackageJsonWithJolieSPackageManager>JSON.parse(readFileSync(this.path, 'utf-8'))
  }


  /**
   * Checks if the corresponding PackageJSON is a jpm package by observing `jpm` field
   *
   * @return {boolean}
   * @memberof PackageJSON
   */
  isJPM(): boolean {
    return !!this.content.jpm
  }

  /**
   * Initialize JPM field on the corresponding PackageJSON
   * * this method writes content to the file
   *
   * @throws { ERR_JPM_EXISTS } if jpm field is already exists in the content
   * @memberof PackageJSON
   */
  init() {
    if (this.content.jpm) {
      throw ERR_JPM_EXISTS
    }

    this.content.jpm = { jolieDependencies: {}, mavenDependencies: {}, mavenIndirectDependencies: {} }
    this.#writeToFile()
  }

  /**
   * Adds npm hosted jolie packages as dependency
   * * this method writes content to the file
   *
   * @param {Package[]} pkgs packages to add
   * @memberof PackageJSON
   */
  addJPMDependencies(pkgs: Package[]) {
    const jpmDep: { [key: string]: string } = {}

    for (const pkg of pkgs) {
      jpmDep[pkg.packageName] = pkg.version
    }
    this.content.jpm.jolieDependencies = { ...this.content.jpm.jolieDependencies, ...jpmDep }

    this.#writeToFile()
  }

  /**
   * Adds maven hosted java project as dependency additional sub-dependencies may included
   * * this method writes content to the file
   * 
   * * main dependency will be written in jpm.mavenDependencies, while the jpm.mavenIndirectDependencies describes sub-dependencies
   *
   * @param {Project} [root] main project
   * @param {Project[]} [deps] dependencies of root project
   * @memberof PackageJSON
   */
  addMVNDependencies(root: Project, deps?: Project[]) {
    const mvnDep: { [key: string]: any } = {}
    mvnDep[`${root.groupID}:${root.artifactID}` as string] = root.version
    this.content.jpm.mavenDependencies = { ...this.content.jpm.mavenDependencies, ...mvnDep }

    if (deps) {
      this.addIndirectMVNDependencies(deps)
    }

    this.#writeToFile()
  }


  /**
   * Adds indirect maven hosted dependencies to the project
   * * this method writes content to the file
   * 
   * @see {@link addMVNDependencies} 
   *
   * @param {Project[]} deps
   * @param {boolean} [writes=false] should writes to files
   * @memberof PackageJSON
   */
  addIndirectMVNDependencies(deps: Project[], writes: boolean = false) {
    const mvnIndirectDep: { [key: string]: any } = {}
    for (const dep of deps) {
      mvnIndirectDep[`${dep.groupID}:${dep.artifactID}`] = dep.version
    }
    this.content.jpm.mavenIndirectDependencies = { ...this.content.jpm.mavenIndirectDependencies, ...mvnIndirectDep }

    if (writes) {
      this.#writeToFile()
    }
  }

  /**
   * Get npm hosted dependencies defined in corresponding package.json
   *
   * @return {Package[]} npm hosted dependencies
   * @memberof PackageJSON
   */
  getJPMDependencies(): Package[] {
    const res = [] as Package[]

    if (this.content.jpm.jolieDependencies) {
      Object.keys(this.content.jpm.jolieDependencies).forEach((key) => {
        res.push(new Package(key + '@' + this.content.jpm.jolieDependencies![key]))
      })
    }

    return res
  }

  /**
   * Get maven hosted dependencies defined in corresponding  package.json
   *
   * @return {*}  {Project[]}
   * @memberof PackageJSON
   */
  getMVNDependencies(): Project[] {
    const res = [] as Project[]

    if (this.content.jpm.mavenDependencies) {
      Object.keys(this.content.jpm.mavenDependencies).forEach((key) => {
        res.push(new Project(key + '@' + this.content.jpm.mavenDependencies![key]))
      })
    }

    if (this.content.jpm.mavenIndirectDependencies) {
      Object.keys(this.content.jpm.mavenIndirectDependencies).forEach((key) => {
        res.push(new Project(key + '@' + this.content.jpm.mavenIndirectDependencies![key]))
      })
    }

    return res
  }

  /**
   * Removes dependency by key
   * * this method writes content to the file
   *
   * @param {string} target
   * @memberof PackageJSON
   */
  removeDependency(target: string) {
    if (this.content.jpm.mavenDependencies && this.content.jpm.mavenDependencies[target]) {
      delete this.content.jpm.mavenDependencies[target]
    }

    if (this.content.jpm.jolieDependencies && this.content.jpm.jolieDependencies[target]) {
      delete this.content.jpm.jolieDependencies[target]
    }

    this.#writeToFile()
  }


  /**
   * clear content inside mavenIndirectDependencies
   * * this method writes content to the file
   *
   * @memberof PackageJSON
   */
  clearMVNIndirectDependencies() {

    if (this.content.jpm.mavenIndirectDependencies) {
      this.content.jpm.mavenIndirectDependencies = {}
    }

    this.#writeToFile()
  }

  /**
   * Write virtual content to file
   * 
   * @private
   * @memberof PackageJSON
   */
  #writeToFile() {
    const data = JSON.stringify(this.content, null, 2)
    writeFileSync(this.path, data)
  }
}
