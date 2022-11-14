import { Command } from '@oclif/core';
import { join } from 'path';
import { copyJARToDir } from '../../downloader';
export default class HooksPostInstall extends Command {
    static override hidden = true;
    static override description = `Hooks script to run after jpm package is installed.
  Currently, it copy the JARs in package tarball to lib directory`;

    static override examples = [
        'jpm hooks postinstall'
    ];

    public async run(): Promise<void> {
        await copyJARToDir(process.cwd(), join(process.cwd(), 'lib'));
    }
}
