/* eslint-disable no-use-before-define */
import '../@types'
import pomParser from 'pom-parser'
import Project from './project'
import debug from 'debug'
export { default as Project } from './project'

const logger = debug('mvn')
// result from artifact search
export declare namespace MavenSearchResult {

  export interface Params {
    q: string;
    core: string;
    spellcheck: string;
    indent: string;
    fl: string;
    start: string;
    sort: string;
    rows: string;
    wt: string;
    version: string;
  }

  export interface ResponseHeader {
    status: number;
    QTime: number;
    params: Params;
  }

  export interface Doc {
    id: string;
    g: string;
    a: string;
    latestVersion: string;
    repositoryId: string;
    p: string;
    timestamp: number;
    versionCount: number;
    text: string[];
    ec: string[];
  }

  export interface Response {
    numFound: number;
    start: number;
    docs: Doc[];
  }

  export interface Spellcheck {
    suggestions: any[];
  }

  export interface Root {
    responseHeader: ResponseHeader;
    response: Response;
    spellcheck: Spellcheck;
  }

}

// result from pom-parser
export declare namespace PomParsingResult {

  export interface Root {
    project: Project;
  }

  export interface Project {
    xmlns: string;
    'xmlns:xsi': string;
    'xsi:schemaLocation': string;
    parent?: Parent;
    modelversion: Modelversion;
    groupid: string;
    artifactid: string;
    version: string;
    packaging: string;
    name: string;
    properties?: Properties;
    build?: Build;
    reporting?: Reporting;
    dependencymanagement?: {
      dependencies: Dependencies
    };
    dependencies?: Dependencies;
    profiles?: Profiles;
  }

  export interface Build {
    finalname: string;
    resources: Resources;
    plugins: BuildPlugins;
  }

  export interface BuildPlugins {
    plugin: Parent[];
  }

  export interface Parent {
    groupid: string;
    artifactid: string;
    configuration?: Configuration;
    version?: string;
  }

  export interface Configuration {
    source?: string;
    target?: string;
    optimize?: string;
    serverid?: string;
    webresources?: Webresources;
    rootpackage?: string;
  }

  export interface Webresources {
    resource: WebresourcesResource;
  }

  export interface WebresourcesResource {
    directory: string;
    filtering: string;
    includes: Includes;
  }

  export interface Includes {
    include: string;
  }

  export interface Resources {
    resource: ResourceElement[];
  }

  export interface ResourceElement {
    directory: string;
    filtering?: string;
  }

  export interface Dependencies {
    dependency: Dependency[];
  }

  export interface Dependency {
    groupid: string;
    artifactid: string;
    version?: string;
    type?: string;
    scope?: string;
  }

  export interface Modelversion {
    _: string;
    parallel: string;
  }

  export interface Profiles {
    profile: Profile;
  }

  export interface Profile {
    id: string;
    repositories: Repositories;
    pluginrepositories: Pluginrepositories;
  }

  export interface Pluginrepositories {
    pluginrepository: Repository;
  }

  export interface Repository {
    id: string;
    name: string;
    url: string;
  }

  export interface Repositories {
    repository: Repository;
  }

  export interface Properties {
    [k: string]: string
  }

  export interface Reporting {
    plugins: ReportingPlugins;
  }

  export interface ReportingPlugins {
    plugin: Parent;
  }
}

/**
 * Guess the target if it is an npm hosted package
 *
 * @param {string} target target package name
 * @return {boolean}
 */
export const guessIfMVNPackage = (target: string): boolean => {
  if (target.includes(':')) {
    return true
  }

  return false
}

type ParsePomOpt = {
  xmlContent: string
  filePath: string
}

/**
 * Parses pom file into a Project type
 * 
 * @export parsePom
 * @param {Partial<ParsePomOpt>} opts
 * @return {Promise<PomParsingResult.Project>}
 */
export const parsePom = (opts: Partial<ParsePomOpt>): Promise<PomParsingResult.Project> => {
  return new Promise(
    (resolve, reject) => {
      pomParser.parse(opts, async function (err: string, pomResponse: { pomObject: PomParsingResult.Root }) {
        if (err) {
          reject(err)
          return
        }
        if (pomResponse.pomObject.project.dependencymanagement && pomResponse.pomObject.project.dependencymanagement.dependencies) {
          if (typeof pomResponse.pomObject.project.dependencymanagement.dependencies === 'string') {
            pomResponse.pomObject.project.dependencymanagement.dependencies = { dependency: [] }
          } else if (!Array.isArray(pomResponse.pomObject.project.dependencymanagement.dependencies.dependency)) {
            pomResponse.pomObject.project.dependencymanagement.dependencies.dependency = [pomResponse.pomObject.project.dependencymanagement.dependencies.dependency]
          }
        }
        if (pomResponse.pomObject.project.dependencies) {
          if (typeof pomResponse.pomObject.project.dependencies === 'string') {
            pomResponse.pomObject.project.dependencies = { dependency: [] }
          } else if (!Array.isArray(pomResponse.pomObject.project.dependencies.dependency)) {
            pomResponse.pomObject.project.dependencies.dependency = [pomResponse.pomObject.project.dependencies.dependency]
          }
        }

        if (!pomResponse.pomObject.project.groupid && pomResponse.pomObject.project.parent?.groupid) {
          pomResponse.pomObject.project.groupid = pomResponse.pomObject.project.parent?.groupid
        }

        if (!pomResponse.pomObject.project.version && pomResponse.pomObject.project.parent?.version) {
          pomResponse.pomObject.project.version = pomResponse.pomObject.project.parent?.version
        }

        resolve(pomResponse.pomObject.project)
      })
    }
  )
}

/**
 * Filters non-necessary dependencies to run jolie's java service.
 * 
 * @export filterDependencies
 * @param {PomParsingResult.Dependency[]} deps
 * @return {PomParsingResult.Dependency[]}
 */
export const filterDependencies = (deps: PomParsingResult.Dependency[]): PomParsingResult.Dependency[] => {
  return deps.filter((e) => {
    return e.groupid !== 'org.jolie-lang' && e.scope === 'runtime'
  })
}

/**
 * Merges properties declared on apply's to main, main will have highest precedence.
 *
 * @export mergeProperties
 * @param {Project} main main Project
 * @param {Project[]} apply sub Projects
 * @return {PomParsingResult.Properties}
 */
export const mergeProperties = (main: Project, apply: Project[]): PomParsingResult.Properties => {
  return [main, ...apply].reduce((prev, curr) => {
    return { ...(curr.pom)!.properties, ...prev }
  }, {})
}

/**
 * Resolves version of the distribution from properties, version defined in passing pom object will have highest precedence
 * otherwise return latest
 *
 * @export resolveVersion
 * @param {string} versionStr
 * @param {PomParsingResult.Project} pom
 * @param {PomParsingResult.Properties} [additionalProperties]
 * @return {*}  {string}
 */
export const resolveVersion = (versionStr: string, pom: PomParsingResult.Project, additionalProperties?: PomParsingResult.Properties): string => {
  if (versionStr.startsWith('${')) {
    const propTarget = versionStr.substring(2, versionStr.length - 1)
    if (propTarget === 'project.version') {
      return pom.version
    } else if (pom.properties && pom.properties[propTarget]) {
      return pom.properties[propTarget]!
    } else if (additionalProperties && additionalProperties[propTarget]) {
      return additionalProperties[propTarget]!
    } else {
      logger(`Unable to resolve package ${pom.groupid}:${pom.artifactid}@${versionStr}, use latest`)
      return 'latest'
    }
  }
  return versionStr
}

/**
 * Recursively fetches parent Projects defined in rootProject
 *
 * @export fetchParent
 * @param {PomParsingResult.Project} rootProject
 * @return {*}  {Promise<Project[]>}
 */
export const fetchParent = async (rootProject: PomParsingResult.Project): Promise<Project[]> => {
  const res: Project[] = []
  while (rootProject.parent) {
    logger(`fetching parent of ${rootProject.groupid}:${rootProject.artifactid}@${rootProject.version}`)
    logger(`parent before resolve version: ${rootProject.parent.groupid}:${rootProject.parent.artifactid}@${rootProject.parent.version}`)
    const version = resolveVersion(rootProject.parent.version!, rootProject)
    logger(`parent: ${rootProject.parent.groupid}:${rootProject.parent.artifactid}@${version}`)

    const parentProject = new Project(rootProject.parent.groupid, rootProject.parent.artifactid, version)
    const parentPOM = await parentProject.getPOM()
    if (res.filter((e) => e.groupID === parentProject.groupID && e.artifactID === parentProject.artifactID).length > 0) {
      break
    }
    res.push(parentProject)
    rootProject = parentPOM
  }
  return res
}
/**
 * Merges dependenciesmanagement of root and its parents fields into one
 *
 * @param {Project} root
 * @param {Project[]} parents
 * @return {*}  {Array<PomParsingResult.Dependency>}
 */
export const mergeDependenciesManagement = (root: Project, parents: Project[]): Array<PomParsingResult.Dependency> => {
  const res: Array<PomParsingResult.Dependency> = [] as Array<PomParsingResult.Dependency>
  if (root.pom?.dependencymanagement) {
    res.push(...root.pom?.dependencymanagement.dependencies.dependency)
  }
  for (const project of parents) {
    if (project.pom?.dependencymanagement) {
      res.push(...project.pom?.dependencymanagement.dependencies.dependency)
    }
  }
  return res
}