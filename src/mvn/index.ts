/* eslint-disable no-use-before-define */
import '../@types'
import pomParser from 'pom-parser'
import Artifact from './artifact'
import debug from 'debug'
export { default as Artifact } from './artifact'

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

export const filterDependencies = (deps: PomParsingResult.Dependency[]): PomParsingResult.Dependency[] => {
  return deps.filter((e) => {
    return e.groupid !== 'org.jolie-lang' && e.scope !== 'test'
  })
}

export const mergeProperties = (main: Artifact, apply: Artifact[]): PomParsingResult.Properties => {
  return [main, ...apply].reduce((prev, curr) => {
    return { ...(curr.pom)!.properties, ...prev }
  }, {})
}

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

export const fetchParent = async (rootProject: PomParsingResult.Project): Promise<Artifact[]> => {
  const res: Artifact[] = []
  while (rootProject.parent) {
    logger(`fetching parent of ${rootProject.groupid}:${rootProject.artifactid}@${rootProject.version}`)
    logger(`parent before resolve version: ${rootProject.parent.groupid}:${rootProject.parent.artifactid}@${rootProject.parent.version}`)
    const version = resolveVersion(rootProject.parent.version!, rootProject)
    logger(`parent: ${rootProject.parent.groupid}:${rootProject.parent.artifactid}@${version}`)

    const parentArtifact = new Artifact(rootProject.parent.groupid, rootProject.parent.artifactid, version)
    const parentPOM = await parentArtifact.getPOM()
    if (res.filter((e) => e.groupID === parentArtifact.groupID && e.artifactID === parentArtifact.artifactID).length > 0) {
      break
    }
    res.push(parentArtifact)
    rootProject = parentPOM
  }
  return res
}

export const mergeDependenciesManagement = (root: Artifact, parents: Artifact[]): Array<PomParsingResult.Dependency> => {
  const res: Array<PomParsingResult.Dependency> = [] as Array<PomParsingResult.Dependency>
  if (root.pom?.dependencymanagement) {
    res.push(...root.pom?.dependencymanagement.dependencies.dependency)
  }
  for (const artifact of parents) {
    if (artifact.pom?.dependencymanagement) {
      res.push(...artifact.pom?.dependencymanagement.dependencies.dependency)
    }
  }
  return res
}

// export const mapVersionWithProperties()
