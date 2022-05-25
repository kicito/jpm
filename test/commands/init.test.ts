import { expect, test } from '@oclif/test'
import { describe } from 'mocha'
import { createTestDirIfNotExist, deleteTestDirIfNotExist } from '../helpers/testUtil'
import PackageJSON from '../../src/packageJSON'
import { cpSync } from 'fs'
import { join, resolve } from 'path'

const resourcesPath = resolve(__dirname, '..', 'resources')
describe('init', () => {
  test
    .do(() => {
      const path = createTestDirIfNotExist('init')
      process.chdir(path)
      cpSync(join(resourcesPath, 'minimum_package.json'), join(path, 'package.json'))
    })
    .stdout()
    .command(['init'])
    .it('runs init', (ctx, done) => {
      expect(ctx.stdout).to.contain('Adding jpm related fields to current directory')
      const p: PackageJSON = new PackageJSON()
      expect(p.isJPM()).to.eql(true)
      deleteTestDirIfNotExist()
      done()
    })

  // test
  //   .stdout()
  //   .command(['init', '--name', 'jeff'])
  //   .it('runs hello --name jeff', ctx => {
  //     expect(ctx.stdout).to.contain('hello jeff')
  //   })
})
