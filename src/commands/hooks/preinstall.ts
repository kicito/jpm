import { Command, Flags } from '@oclif/core'
import { ERR_NOT_JPM } from '../../errors'
import chalk from 'chalk'
export default class HooksPreinstall extends Command {
  static override hidden = true
  static override description = `Hooks script to run before jpm package is installed.
  Currently, it checks and throw error if the package manager is not ${chalk.bold('jpm')}
  eg. npm install JOLIE_PACKAGE should fail the installation`

  static override examples = [
    'jpm hooks preinstall'
  ]

  static override flags = {
    allowGlobal: Flags.boolean({ description: 'allow npm install -g jolie-package' })
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(HooksPreinstall)
    if (flags.allowGlobal && process.env['npm_config_global'] === 'true') {
      return
    }

    if (process.env['npm_execpath'] && process.env['npm_execpath'].indexOf('jpm') === -1) {

      throw ERR_NOT_JPM
    }
  }
}