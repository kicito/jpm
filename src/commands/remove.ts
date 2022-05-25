import { Command } from '@oclif/core'
import { ERR_NOT_JPM_PACKAGE } from '../errors'
import PackageJSON from '../packageJSON'
import { existsSync,rmdirSync } from "fs"
import { join } from 'path'
import Install from './install'

export default class Remove extends Command {
  static override description = `Remove Jolie related dependency to the project
  Currently, it removes the corresponding entry on package.json file and perform install command
  `

  static override examples = [
    `$ jpm remove jolie-jsoup
    Remove jolie-jsoup from the dependencies`,
  ]

  static override args = [{ name: 'target', description: 'Target package', require: true }]

  public async run(): Promise<void> {
    const packageJSON = new PackageJSON()
    if (!packageJSON.isJPM()) {
      throw ERR_NOT_JPM_PACKAGE
    }
    const { args } = await this.parse(Remove)
    packageJSON.removeDependency(args['target'])
    packageJSON.removeMVNIndiectDependencies()

    if (existsSync(join(process.cwd(), "package"))){
      rmdirSync(join(process.cwd(), "package"))
    }
    if (existsSync(join(process.cwd(), "lib"))){
      rmdirSync(join(process.cwd(), "lib"))
    }

    await Install.run()

  }
}
