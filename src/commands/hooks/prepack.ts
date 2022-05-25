import { Command } from '@oclif/core'
import chalk from 'chalk';
import { existsSync } from 'fs';
import { join } from 'path';
import { which, exec } from 'shelljs';
import { ERR_MVN_NOT_FOUND } from '../../errors';
export default class HooksPrePack extends Command {
    static override hidden = true

    static override description = `Hooks script to run before jpm package is packed
    Currently, it perform a lookup to ${chalk.bold("pom.xml")} in the working directory. If found, runs ${chalk.bold("mvn package")} before continue.`

    static override examples = [
        'jpm hooks prepack'
    ]

    public async run(): Promise<void> {
        const pomPath = join(process.cwd(), "pom.xml")
        if (existsSync(pomPath)) {
            this.log("found pom.xml: running mvn package")
            if (!which('mvn')) {
                throw ERR_MVN_NOT_FOUND
            }
            if (exec("mvn package").code !== 0) {
                throw new Error('Error: mvn package failed');
            }
        }
    }
}
