import { Command, Flags } from '@oclif/core'

import { Project } from '../mvn'
import { Package } from '../npm'
import { errorImportTarget, ERR_NOT_JPM_PACKAGE } from '../errors'
import { join } from 'path'
import PackageJSON from '../packageJSON'
import LocalProject from '../mvn/local_project'
import { RepoType, guessRepo, buildProjectFromTarget, buildPackageFromTarget, } from '../lib'

type InstallTargetOptions = {
  repo: RepoType
}

export default class Install extends Command {
  static override description = 'Add Jolie related dependency to the project'

  static override examples = [
    `$ jpm install
scan entries from package.json and download all dependencies`,
    `$ jpm install @jolie/websocket
add @jolie/websocket into the project`,
    `$ jpm install org.jsoup:jsoup
add maven's jsoup into the project`,
    `$ jpm install jolie-jsoup@latest
add jolie-jsoup with latest tag into the project`
  ]

  static override flags = {
    repo: Flags.enum<RepoType>({ char: 'r', description: 'specify the lookup repository', options: ['mvn', 'npm'] })
  }

  static override args = [{ name: 'target', description: 'Target package' }]


  /**
   * Read content from package.json
   *
   * @return {PackageJSON}
   * @memberof Install
   * @throws {ERR_NOT_JPM_PACKAGE} When target package.json is not jpm compatible.
   */
  readPackageJSON(): PackageJSON {
    const packageJSON = new PackageJSON()
    if (!packageJSON.isJolie()) {
      throw ERR_NOT_JPM_PACKAGE
    }
    return packageJSON
  }

  /**
   * `jpm install` 
   *
   * @return {Promise<void>}
   * @memberof Install
   */
  async install(): Promise<void> {
    const packageJSON = this.readPackageJSON()
    const mvnDeps = packageJSON.getMVNDependencies()
    await Project.downloadDistJarAndDependencies(join(process.cwd(), 'lib'), mvnDeps)

    const deps = packageJSON.getJPMDependencies()
    for (const dep of deps) {
      const ds = await dep.getDependencies()

      const jpmDeps = [] as Package[]
      const mvnDeps = [] as Project[]

      for (const dep of ds) {
        if (dep instanceof Project) {
          mvnDeps.push(dep)
        } else if (dep instanceof Package) {
          jpmDeps.push(dep)
        }
      }
      await Package.downloadPackageAndDependencies(join(process.cwd()), dep, jpmDeps)
      await Project.downloadDistJarAndDependencies(join(process.cwd(), 'lib'), mvnDeps)
      if (mvnDeps.length > 0) {
        packageJSON.addIndirectMVNDependencies(mvnDeps, true)
      }
    }

  }

  async installMVNTarget(target: Project): Promise<void> {
    const packageJSON = this.readPackageJSON()

    if (target.version === 'latest') {
      target.version = await target.getLatestProjectVersion()
    }
    const deps = await target.getProjectDependencies()
    await Project.downloadDistJarAndDependencies(join(process.cwd(), 'lib'), deps)

    packageJSON.addMVNDependencies(deps[0]!, deps.slice(1))
    if (LocalProject.isMavenProject()) {
      const localPom = await LocalProject.load()
      this.log('Adding', target.toString(), 'to pom.xml')
      try {
        localPom.addDependencies(target)
      } catch (e) {
        this.log(e + ', skip add dependency to pom')
      }
    }
    deps.forEach(e => this.log(`Installed ${e.toString()}`))
  }

  async installNPMTarget(target: Package): Promise<void> {
    const packageJSON = this.readPackageJSON()

    const deps = await target.getDependencies()
    const jpmDeps = [] as Package[]
    const mvnDeps = [] as Project[]

    for (const dep of deps) {
      if (dep instanceof Project) {
        mvnDeps.push(dep)
      } else if (dep instanceof Package) {
        jpmDeps.push(dep)
      }
    }
    await Package.downloadPackageAndDependencies(join(process.cwd()), target, jpmDeps)
    await Project.downloadDistJarAndDependencies(join(process.cwd(), 'lib'), mvnDeps)

    packageJSON.addJPMDependencies([target])
    if (jpmDeps.length > 0) {
      jpmDeps.forEach(e => this.log(`Installed ${e.toString()} as ${target.toString()} dependency`))
    }

    if (mvnDeps.length > 0) {
      packageJSON.addIndirectMVNDependencies(mvnDeps, true)
      mvnDeps.forEach(e => this.log(`Installed ${e.toString()} as ${target.toString()} dependency`))
    }
  }

  /**
   * `jpm install TARGET`
   *
   * @param {string} target
   * @param {InstallTargetOptions} [opts]
   * @return {*}  {Promise<void>}
   * @memberof Install
   */
  async installWithTarget(target: string, opts?: InstallTargetOptions): Promise<void> {

    this.log(`Installing ${target}`)

    const repo = opts ? opts.repo : guessRepo(target)

    if (repo === 'mvn') {
      const mvnProject = buildProjectFromTarget(target)
      await this.installMVNTarget(mvnProject)
    } else if (repo === 'npm') {
      const npmPackage = buildPackageFromTarget(target)
      await this.installNPMTarget(npmPackage)
    } else {
      throw errorImportTarget(target)
    }

    this.log(`Installed ${target}`)
  }

  async run(): Promise<void> {

    const { args } = await this.parse(Install)

    if (args['target']) {
      await this.installWithTarget(args['target'], args['repo'] ? { repo: args['repo'] } : undefined)
    } else {
      await this.install();
    }
  }
}
