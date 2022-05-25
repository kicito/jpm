import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { JSONSchemaForNPMPackageJsonWithJolieSPackageManager } from './types'
import { ERR_JPM_EXISTS } from '../errors'
import Artifact from '../mvn/artifact'
import { Package } from '../npm'

export default class PackageJSON {
  path: string
  content: JSONSchemaForNPMPackageJsonWithJolieSPackageManager
  constructor(path: string = '.') {
    this.path = path.endsWith('package.json') ? path : resolve(path, 'package.json')
    this.content = <JSONSchemaForNPMPackageJsonWithJolieSPackageManager>JSON.parse(readFileSync(this.path, 'utf-8'))
  }

  isJPM() {
    return !!this.content.jpm
  }

  init() {
    if (this.content.jpm) {
      throw ERR_JPM_EXISTS
    }

    this.content.jpm = { jolieDependencies: {}, mavenDependencies: {}, mavenIndirectDependencies: {} }
    this.#writeToFile()
  }

  addJPMDependencies(pkgs: Package[]) {
    const jpmDep: { [key: string]: any } = {}

    for (const pkg of pkgs) {
      jpmDep[pkg.packageName] = pkg.version
    }
    this.content.jpm.jolieDependencies = { ...this.content.jpm.jolieDependencies, ...jpmDep }

    this.#writeToFile()
  }

  addMVNDependencies(root?: Artifact, deps?: Artifact[]) {
    if (root) {
      const mvnDep: { [key: string]: any } = {}
      mvnDep[`${root.groupID}:${root.artifactID}` as string] = root.version
      this.content.jpm.mavenDependencies = { ...this.content.jpm.mavenDependencies, ...mvnDep }
    }

    if (deps) {
      const mvnIndirectDep: { [key: string]: any } = {}
      for (const dep of deps) {
        mvnIndirectDep[`${dep.groupID}:${dep.artifactID}`] = dep.version
      }
      this.content.jpm.mavenIndirectDependencies = { ...this.content.jpm.mavenIndirectDependencies, ...mvnIndirectDep }
    }

    this.#writeToFile()
  }
  
  getJPMDependencies(): Package[] {
    const res = [] as Package[]

    if (this.content.jpm.jolieDependencies) {
      Object.keys(this.content.jpm.jolieDependencies).forEach((key) => {
        res.push(new Package(key + '@' + this.content.jpm.jolieDependencies![key]))
      })
    }

    return res
  }

  getMVNDependencies(): Artifact[] {
    const res = [] as Artifact[]

    if (this.content.jpm.mavenDependencies) {
      Object.keys(this.content.jpm.mavenDependencies).forEach((key) => {
        res.push(new Artifact(key + '@' + this.content.jpm.mavenDependencies![key]))
      })
    }

    if (this.content.jpm.mavenIndirectDependencies) {
      Object.keys(this.content.jpm.mavenIndirectDependencies).forEach((key) => {
        res.push(new Artifact(key + '@' + this.content.jpm.mavenIndirectDependencies![key]))
      })
    }

    return res
  }

  removeDependency(target: string){
    if (this.content.jpm.mavenDependencies && this.content.jpm.mavenDependencies[target]) {
      delete this.content.jpm.mavenDependencies[target]
    }

    if (this.content.jpm.jolieDependencies && this.content.jpm.jolieDependencies[target]) {
      delete this.content.jpm.jolieDependencies[target]
    }

    this.#writeToFile()
  }



  removeMVNIndiectDependencies(){

    if (this.content.jpm.mavenIndirectDependencies) {
      this.content.jpm.mavenIndirectDependencies = {}
    }

    this.#writeToFile()
  }

  #writeToFile() {
    const data = JSON.stringify(this.content, null, 2)
    writeFileSync(this.path, data)
  }
}
