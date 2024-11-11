import { runCommand } from '@oclif/test';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  resourcesPath,
  createTestDirIfNotExist,
  deleteTestDirIfNotExist,
} from '../helpers/testUtil';
import PackageJSON from '../../src/packageJSON';
import { cpSync } from 'fs';
import { join } from 'path';

describe('init', () => {
  it('init should add jpm related fields to package.json in current working directory', async () => {
    const path = createTestDirIfNotExist('init');
    process.chdir(path);
    cpSync(
      join(resourcesPath, 'minimum_package.json'),
      join(path, 'package.json')
    );
    const { stdout } = await runCommand(['init'], undefined, {
      print: true,
      stripAnsi: true,
    });
    expect(stdout).to.contain(
      'Adding jpm related fields to current working directory'
    );
    const p: PackageJSON = new PackageJSON();
    expect(p.isJolie()).to.eql(true);
    deleteTestDirIfNotExist();
  });
});
