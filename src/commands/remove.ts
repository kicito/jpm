import { Command, Args } from '@oclif/core';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'path';
import { ERR_NOT_JPM_PACKAGE } from '../errors';
import { buildProjectFromTarget, guessRepo } from '../lib';
import LocalProject from '../mvn/local_project';
import PackageJSON from '../packageJSON';
import Install from './install';

export default class Remove extends Command {
  static override description = `Remove Jolie related dependency to the project
  Currently, it removes the corresponding entry on package.json file and perform install command
  `;

  static override examples = [
    `$ jpm remove jolie-jsoup
    Remove jolie-jsoup from the dependencies`,
  ];

  static override args = {
    target: Args.string({ description: 'Target package', required: true }),
  };

  public async run(): Promise<void> {
    const packageJSON = new PackageJSON();
    if (!packageJSON.isJolie()) {
      throw ERR_NOT_JPM_PACKAGE;
    }
    const { args } = await this.parse(Remove);
    const { target } = args;
    this.log(`Removing ${target}`);
    const type = guessRepo(target);
    packageJSON.removeDependency(target, type);
    packageJSON.clearMVNIndirectDependencies();

    if (existsSync(join(process.cwd(), 'packages'))) {
      rmSync(join(process.cwd(), 'packages'), { recursive: true, force: true });
    }
    if (existsSync(join(process.cwd(), 'lib'))) {
      rmSync(join(process.cwd(), 'lib'), { recursive: true, force: true });
    }

    if (LocalProject.isMavenProject() && type === 'mvn') {
      const proj = buildProjectFromTarget(target);
      const localPom = await LocalProject.load();
      localPom.removeDependencies(proj);
    }
    this.log(`Removed ${target}`);

    await Install.run([]);
  }
}
