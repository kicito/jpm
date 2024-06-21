import { Command, Args } from '@oclif/core';
import PackageJSON from '../packageJSON';

export default class Init extends Command {
  static override description =
    'Generate jpm\'s specific configuration to package.json';

  static override examples = [
    `$ jpm init
    add jpm related fields to package.json in current working directory`,
    `$ jpm init [path]
    add jpm related fields to package.json in specify path`,
  ];

  static override args = {
    path: Args.string({ description: 'Target package' }),
  };

  static override strict = false;
  public async run(): Promise<void> {
    const { args } = await this.parse(Init);
    let packageJSON: PackageJSON;
    if (args.path) {
      this.log('Adding jpm related fields to ' + args.path);
      packageJSON = new PackageJSON(args.path);
    } else {
      this.log('Adding jpm related fields to current working directory');
      packageJSON = new PackageJSON();
    }

    packageJSON.init();
  }
}
