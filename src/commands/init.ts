import { Command } from '@oclif/core'
import PackageJSON from '../packageJSON'

export default class Init extends Command {
  static override description = 'Generate jpm\'s specific configuration to package.json'

  static override examples = [
    `$ jpm init
    add jpm related fields to package.json in current working directory`,
    `$ jpm init [path]
    add jpm related fields to package.json in specify path`
  ]

  static override args: [{ name: 'path', description: 'Target package' }]

  public async run(): Promise<void> {
    const { args } = await this.parse(Init)
    const { path } = args
    if (path) {
      this.log('Adding jpm related fields to ' + path)
    } else {
      this.log('Adding jpm related fields to current directory')
    }

    const packageJSON = new PackageJSON(path)
    packageJSON.init()
  }
}
