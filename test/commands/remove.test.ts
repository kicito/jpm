import { runCommand } from '@oclif/test';
import { cpSync, readFileSync } from 'node:fs';
import { describe, after,it } from 'mocha';
import { join } from 'node:path';
import {
  createTestDirIfNotExist,
  deleteTestDirIfNotExist,
  resourcesPath,
} from '../helpers/testUtil';
import { expect } from 'chai';

describe('remove', () => {
  let path: string;
  after(() => {
    deleteTestDirIfNotExist();
  });

  it('remove should correctly remove the dependency', async () => {
    path = createTestDirIfNotExist('remove');
    process.chdir(path);
    cpSync(
      join(resourcesPath, 'minimum_jpm_package_with_dep.json'),
      join(path, 'package.json')
    );

    const { stdout } = await runCommand(
      ['remove', 'org.jsoup:jsoup'],
      undefined,
      {
        print: true,
        stripAnsi: true,
      }
    );

    expect(stdout).to.contain('Removed');
    const pkgStr = readFileSync(join(path, 'package.json'), 'utf8');
    const pkgJson = JSON.parse(pkgStr);
    expect(Object.keys(pkgJson.jolie.maven.dependencies).length === 0);
  });
});
