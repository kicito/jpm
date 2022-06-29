import { Command, Flags } from '@oclif/core'

import { Artifact, guessIfMVNPackage } from '../mvn'
import { Package, guessIfNPMPackage } from '../npm'
import { errorImportTarget, ERR_NOT_JPM_PACKAGE } from '../errors'
import { join } from 'path'
import PackageJSON from '../packageJSON'

type RepoType = 'mvn' | 'npm'

const guessRepo = (target: string): RepoType => {
  if (guessIfMVNPackage(target)) {
    return 'mvn'
  }

  if (guessIfNPMPackage(target)) {
    return 'npm'
  }

  throw errorImportTarget(target)
}

const buildArtifactFromTarget = (target: string): Artifact => {
  return new Artifact(target)
}

const buildPackageFromTarget = (target: string): Package => {
  return new Package(target)
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

  async run(): Promise<void> {
    const packageJSON = new PackageJSON()
    if (!packageJSON.isJPM()) {
      throw ERR_NOT_JPM_PACKAGE
    }

    const { args } = await this.parse(Install)

    if (args['target']) {
      this.log(`installing ${args['target']}`)

      const repo = args['repo'] ? args['repo'] : guessRepo(args['target'])

      if (repo === 'mvn') {
        const mvnArtifact = buildArtifactFromTarget(args['target'])
        if (mvnArtifact.version === 'latest') {
          mvnArtifact.version = await mvnArtifact.getLatestArtifactVersion()
        }
        const deps = await mvnArtifact.getArtifactDependencies()
        await Artifact.downloadDistJarAndDependencies(join(process.cwd(), 'lib'), deps)

        packageJSON.addMVNDependencies(deps[0]!, deps.slice(1))
        deps.forEach(e => this.log(`Installed ${e.toString()}`))

      } else if (repo === 'npm') {
        const npmPackage = buildPackageFromTarget(args['target'])
        const deps = await npmPackage.getDependencies()
        const jpmDeps = [] as Package[]
        const mvnDeps = [] as Artifact[]

        for (const dep of deps) {
          if (dep instanceof Artifact) {
            mvnDeps.push(dep)
          } else if (dep instanceof Package) {
            jpmDeps.push(dep)
          }
        }
        await Package.downloadPackageAndDependencies(join(process.cwd()), jpmDeps)
        await Artifact.downloadDistJarAndDependencies(join(process.cwd(), 'lib'), mvnDeps)

        if (jpmDeps.length > 0) {
          packageJSON.addJPMDependencies(jpmDeps)
          jpmDeps.forEach(e => this.log(`Installed ${e.toString()}`))
        }

        if (mvnDeps.length > 0) {
          packageJSON.addIndirectMVNDependencies(mvnDeps, true)
          mvnDeps.forEach(e => this.log(`Installed ${e.toString()}`))
        }
      } else {
        throw errorImportTarget(args['target'])
      }
    } else {
      const mvnDeps = packageJSON.getMVNDependencies()
      await Artifact.downloadDistJarAndDependencies(join(process.cwd(), 'lib'), mvnDeps)


      const deps = await packageJSON.getJPMDependencies()
      for (const dep of deps) {
        const ds = await dep.getDependencies()

        const jpmDeps = [] as Package[]
        const mvnDeps = [] as Artifact[]

        for (const dep of ds) {
          if (dep instanceof Artifact) {
            mvnDeps.push(dep)
          } else if (dep instanceof Package) {
            jpmDeps.push(dep)
          }
        }
        await Package.downloadPackageAndDependencies(join(process.cwd()), jpmDeps)
        await Artifact.downloadDistJarAndDependencies(join(process.cwd(), 'lib'), mvnDeps)
        if (mvnDeps.length > 0) {
          packageJSON.addIndirectMVNDependencies(mvnDeps, true)
        }

        if (jpmDeps.length > 0) {
          packageJSON.addJPMDependencies(jpmDeps)
        }
      }
    }
  }
}
