import { runCommand } from '@oclif/test';
import { cpSync, existsSync } from 'fs';
import { glob } from 'glob';
import { describe, after, it } from 'mocha';
import { join } from 'path';
import { createTestDirIfNotExist, deleteTestDirIfNotExist, resourcesPath } from '../helpers/testUtil';
import { expect } from 'chai';
import nock from 'nock';

describe('install', () => {

  after(() => {
    deleteTestDirIfNotExist();
  });

    it('install should move jars file to lib', async () => {
        const path = createTestDirIfNotExist('install');
        process.chdir(path);
        cpSync(join(resourcesPath, 'minimum_jpm_package.json'), join(path, 'package.json'));
        nock('https://registry.npmjs.com')
          .get('/jolie-jsoup')
          .replyWithFile(200, join(resourcesPath, 'registry_jolie_jsoup.json'))
          .get('/jolie-jsoup/-/jolie-jsoup-0.2.2.tgz')
          .replyWithFile(200, join(resourcesPath, 'jolie-jsoup-0.2.2.tgz'));

        const {stdout} = await runCommand(['install', 'jolie-jsoup'], undefined, {
            print: true,
            stripAnsi: true,
            
        });
    
        expect(stdout).to.contain('Install');
      expect(existsSync(join(process.cwd(), 'packages', 'jolie-jsoup'))).to.eql(true);
        
      const matches =await glob(join(process.cwd(), 'lib', '**/*.jar'));
        expect(matches.length > 0).to.eql(true);
    });
});
