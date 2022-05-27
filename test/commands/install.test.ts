import { expect, test } from '@oclif/test'
import { cpSync, existsSync } from 'fs'
import { glob } from 'glob'
import { describe, after } from 'mocha'
import { join } from 'path'
import { createTestDirIfNotExist, deleteTestDirIfNotExist, resourcesPath } from '../helpers/testUtil'
describe('install', () => {
  // test
  //   .stdout()
  //   .command(['install'])
  //   .it('runs hello', ctx => {
  //     expect(ctx.stdout).to.contain('hello world')
  //   })

  after(() => {
    deleteTestDirIfNotExist()
  })

  test
    .do(() => {
      const path = createTestDirIfNotExist('init')
      process.chdir(path)
      cpSync(join(resourcesPath, 'minimum_jpm_package.json'), join(path, 'package.json'))
    })
    .nock('https://registry.npmjs.com', api => api
      .get('/jolie-jsoup')
      .replyWithFile(200, join(resourcesPath, 'registry_jolie_jsoup.json'))
      .get('/jolie-jsoup/-/jolie-jsoup-0.2.2.tgz')
      .replyWithFile(200, join(resourcesPath, 'jolie-jsoup-0.2.2.tgz'))
    )
    .stdout()
    .command(['install', 'jolie-jsoup@jpmk'])
    .it('runs install jolie-jsoup', (ctx, done) => {
      expect(ctx.stdout).to.contain('Installed')
      expect(existsSync(join(process.cwd(), 'packages', 'jolie-jsoup'))).to.eql(true)
      glob(join(process.cwd(), 'lib', '**/*.jar'), (err, matches) => {
        expect(!!err).to.eql(false)
        expect(matches.length > 0).to.eql(true)
        done()
      })
    })
})
