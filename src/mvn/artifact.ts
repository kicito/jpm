import fetch from 'node-fetch'
import { fetchParent, MavenSearchResult, mergeProperties, parsePom, PomParsingResult, mergeDependenciesManagement, resolveVersion, filterDependencies } from '.'
import {
  errorArtifactNotFound,
  ERR_MVN_CONNECTION
} from '../errors'
import localRepo from './local_repo'
import debug from 'debug'
import { download } from '../downloader'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
const logger = debug('mvn')
/**
 * Artifact represent a mvn Artifact object
 *
 * @class Artifact
 */
class Artifact {
  /**
   * artifact ID
   *
   * @type {string}
   * @memberof Artifact
   */
  public artifactID: string

  /**
   * group ID
   *
   * @type {string}
   * @memberof Artifact
   */
  public groupID: string

  /**
   * version
   *
   * @type {string}
   * @memberof Artifact
   */
  public version: string

  /**
   * pom
   *
   * @type {PomParsingResult.Project}
   * @memberof Artifact
   */
  public pom?: PomParsingResult.Project

  /**
   * Creates an instance of Artifact using target string.
   * e.g. new Artifact("joliex.jsoup:jolie-jsoup@1.0.0") 
   * 
   * @param {string} target
   * @memberof Artifact
   */
  constructor(target: string);

  /**
   * Creates an instance of Artifact using separated identifier of groupID, artifactID, and version
   * @param {string} groupID
   * @param {string} artifactID
   * @param {string} version
   * @memberof Artifact
   */
  constructor(groupID: string, artifactID: string, version: string);


  /**
   * Constructor implementation
   * @param {...string[]} args
   * @memberof Artifact
   * @throws {Error} illegal number of args
   */
  constructor(...args: string[]) {
    // constructor(target: string) case
    if (args.length === 1) {
      const target = args[0]!
      let groupIDAndArtifactID: string
      if (target.includes('@')) {
        const resSplitAt = target.split('@', 2)
        groupIDAndArtifactID = resSplitAt[0]!
        this.version = resSplitAt[1]!
      } else {
        groupIDAndArtifactID = target
        this.version = 'latest'
      }

      const resSplitColon = groupIDAndArtifactID.split(':', 2)
      this.groupID = resSplitColon[0]!
      this.artifactID = resSplitColon[1]!
      console.log(this.toString())
      return
    }

    // constructor(groupID: string, artifactID: string, version: string) case
    if (args.length === 3) {
      this.groupID = args[0]!
      this.artifactID = args[1]!
      this.version = args[2]!
      console.log(this.toString())
      return
    }
    throw Error('illegal number of args')
  }

  /**
   * Construct maven repository path from the corresponding Artifact.
   * 
   * @return {string} url path to the artifact
   *
   * @memberof Artifact
   */
   #getRepoPath = (): string =>
    `${this.groupID.replace(/\./g, '/')}/${this.artifactID}/${this.version}`

  /**
   * Construct pom on maven repository path from the corresponding Artifact.
   * 
   * @return {string} url path to the artifact
   *
   * @memberof Artifact
   */
  getPOMName = (): string => `${this.artifactID}-${this.version}.pom`

  /**
   * Generate endpoint to retrieve pom file of the artifact
   *
   * @param {string} [prefix="https://repo1.maven.org/maven2"] base url
   * @memberof Artifact
   * @return {string} url to retrieve pom prefix/group/artifact/version/artifactID-version.pom
   */
  #getPOMURL = (prefix = 'https://repo1.maven.org/maven2'): string =>
    `${prefix}/${this.#getRepoPath()}/${this.getPOMName()}`

  /**
   * generate endpoint to retrieve jar file of the artifact
   *
   * @param {string} [prefix="https://repo1.maven.org/maven2"] base url
   * @memberof Artifact
   * @return {string} url to retrieve pom prefix/group/artifact/version/artifactID-version.jar
   */
  getJARURL = (prefix = 'https://repo1.maven.org/maven2'): string =>
    `${prefix}/${this.#getRepoPath()}/${this.getDistJAR()}`

  /**
   * Search latest version of an artifact on maven repository
   *
   * @return {Promise<string>} the latest version on maven repository
   *
   * @throws {ERR_MVN_CONNECTION} unable to connect to maven repository
   * @throws {ERR_ARTIFACT_NOT_FOUND} the given information of the artifact was not found on maven repository
   * @memberof Artifact
   */
  async getLatestArtifactVersion(): Promise<string> {
    const endpoint = `http://search.maven.org/solrsearch/select?q=g:%22${this.groupID}%22+AND+a:%22${this.artifactID}%22`

    logger(
      'searching for groupId: %s, artifactId: %s, with url: %s',
      this.groupID,
      this.artifactID,
      endpoint
    )

    const response = await fetch(endpoint)

    if (!response.ok) throw ERR_MVN_CONNECTION

    const {
      response: { docs }
    } = await response.json() as MavenSearchResult.Root

    if (docs.length === 0) {
      logger('url: %s returns empty array for .docs field', endpoint)

      throw errorArtifactNotFound(endpoint)
    }

    return docs[0]!.latestVersion
  }

  /**
   * Fetch pom.xml from the repository and parsed into Project object
   *
   * @return {Promise<PomParsingResult.Project>} Project object representing pom
   *
   * @memberof Artifact
   */
  async getPOM(): Promise<PomParsingResult.Project> {
    if (this.pom) {
      return this.pom
    } else {
      if (this.version === 'latest') {
        this.version = await this.getLatestArtifactVersion()
      }

      if (localRepo.isArtifactExists(this)) {
        try {
          this.pom = await parsePom({ xmlContent: localRepo.getPOM(this) })
          return this.pom
        } catch (e) {
          logger('unable to parse pom in local repository', e)
        }
      }

      const response = await fetch(this.#getPOMURL())
      const pomContent = await response.text()
      const pom = await parsePom({ xmlContent: pomContent })
      this.pom = pom
      return pom
    }
  }

  /**
   * Apply properties defined in pom.xml to where it reference in versions
   *
   * @return {void}
   *
   * @memberof Artifact
   */
  resolveProperties(properties: PomParsingResult.Properties, dependencymanagement: PomParsingResult.Dependency[]): void {
    if (this.pom!.dependencies) {
      for (const d of this.pom!.dependencies!.dependency) {
        let version = d.version
        if (!version) {
          version = dependencymanagement.find(e => e.groupid === d.groupid && e.artifactid === d.artifactid)?.version || ''
        }
        if (version === '') {
          logger(`Unable to resolve package version of ${d.groupid}:${d.artifactid}, from the dependencies`)
        }
        d.version = resolveVersion(version!, this.pom!, properties)
      }
    }

    if (this.pom!.dependencymanagement) {
      for (const d of this.pom!.dependencymanagement!.dependencies.dependency) {
        let version = d.version
        if (!version) {
          version = dependencymanagement.find(e => e.groupid === d.groupid && e.artifactid === d.artifactid)?.version || ''
        }
        if (version === '') {
          logger(`Unable to resolve package version of ${d.groupid}:${d.artifactid}, from the dependeciesmanagement`)
        }
        d.version = resolveVersion(version!, this.pom!, properties)
      }
    }
  }

  /**
   * Filter out unnecessary dependencies from the pom properties.
   * 
   * Note: this method modifies the virtual pom properties.
   * 
   * @return {void}
   *
   * @memberof Artifact
   */
  filterDependencies(): void {
    if (this.pom!.dependencies) {
      this.pom!.dependencies.dependency = filterDependencies(this.pom!.dependencies.dependency)
    }
  }

  /**
   * Get list of dependencies of the Artifact.
   * 
   * Note: this method modifies the virtual pom properties.
   * 
   * @return {Promise<Artifact[]>}
   *
   * @memberof Artifact
   */
  async getArtifactDependencies(): Promise<Artifact[]> {
    const res: Artifact[] = [this]
    const pom = await this.getPOM()
    let properties: PomParsingResult.Properties = pom.properties ? pom.properties : {}
    let dependencymanagement: PomParsingResult.Dependency[] = pom.dependencymanagement ? pom.dependencymanagement.dependencies.dependency : [] as PomParsingResult.Dependency[]
    if (pom.parent) {
      const parents = await fetchParent(pom)
      properties = mergeProperties(this, parents)
      dependencymanagement = mergeDependenciesManagement(this, parents)
      for (const p of parents) {
        p.resolveProperties(properties, dependencymanagement)
      }
    }

    if (pom.dependencies) {
      this.filterDependencies()
      this.resolveProperties(properties, dependencymanagement)

      for (const dep of pom.dependencies?.dependency) {
        res.push(new Artifact(
          dep.groupid, dep.artifactid, dep.version!
        ))
      }
    }
    return res
  }

  /**
   * Download Jar of the artifact from maven central repository, save to the destination path.
   * 
   * @param {string} dest saving destination
   *
   * @memberof Artifact
   */
  async #downloadDistJar(dest: string): Promise<void> {
    if (localRepo.isArtifactExists(this)) {
      try {
        localRepo.downloadJAR(this, join(dest, this.getDistJAR()))
        return
      } catch (e) {
        logger('unable to download jar from local repository', e)
      }
    }
    await download(this.getJARURL(), join(dest, this.getDistJAR()))
  }

  /**
   * Generate distribution jar file name
   *
   * @return {string} distribution jar file name
   *
   * @memberof Artifact
   */
  getDistJAR(): string {
    return `${this.artifactID}-${this.version}.jar`
  }

  toString(): string {
    return `${this.groupID}:${this.artifactID}@${this.version}`
  }

  /**
   * Download Jar of the from maven central repository. To the destination path 
   * 
   * Note: this method modifies the virtual pom properties.
   * 
   * @param {string} Destination
   * @param {string} Destination
   * @return {string} 
   *
   * @memberof Artifact
   */
  static async downloadDistJarAndDependencies(dest: string, dependencies: Artifact[]): Promise<void> {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true })
    }
    for (const dep of dependencies) {
      await dep.#downloadDistJar(dest)
    }
  }
}

export default Artifact
