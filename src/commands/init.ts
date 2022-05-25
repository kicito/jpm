import { Command } from '@oclif/core'
import PackageJSON from '../packageJSON'

export default class Init extends Command {
  static override description = 'Generate jpm\'s specific configuration to package.json'

  static override examples = [
    `$ jpm init
    add jpm related fields to package.json in current working directory`,
    `$ jpm init [dir]
    add jpm related fields to package.json in specify dir`
  ]

  static override args: [{ name: 'dir', description: 'Target package' }]

  static override strict = false
  public async run(): Promise<void> {
    const { argv } = await this.parse(Init)
    let packageJSON: PackageJSON
    if (argv[0]) {
      this.log('Adding jpm related fields to ' + argv[0])
      packageJSON = new PackageJSON(argv[0])
    } else {
      this.log('Adding jpm related fields to current directory')
      packageJSON = new PackageJSON()
    }

    packageJSON.init()
  }
}
