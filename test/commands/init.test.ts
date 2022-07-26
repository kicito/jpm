import { expect, test } from '@oclif/test'
import { describe } from 'mocha'
import { resourcesPath, createTestDirIfNotExist, deleteTestDirIfNotExist } from '../helpers/testUtil'
import PackageJSON from '../../src/packageJSON'
import { cpSync } from 'fs'
import { join } from 'path'

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
      expect(ctx.stdout).to.contain('Adding jpm related fields to current working directory')
      const p: PackageJSON = new PackageJSON()
      expect(p.isJolie()).to.eql(true)
      deleteTestDirIfNotExist()
      done()
    })
})
