import { expect, test } from '@oclif/test'
import { cpSync, readFileSync } from 'node:fs'
import { describe, after } from 'mocha'
import { join } from 'node:path'
import { createTestDirIfNotExist, deleteTestDirIfNotExist, resourcesPath } from '../helpers/testUtil'

describe('remove', () => {
  let path: string;
  after(() => {
    deleteTestDirIfNotExist()
  })

  test
    .do(() => {
      path = createTestDirIfNotExist('remove')
      process.chdir(path)
      cpSync(join(resourcesPath, 'minimum_jpm_package_with_dep.json'), join(path, 'package.json'))
    })
    .stdout()
    .command(['remove', 'org.jsoup:jsoup'])
    .it('runs remove org.jsoup:jsoup', (ctx) => {
      expect(ctx.stdout).to.contain('Removed')
      const pkgStr = readFileSync(join(path, 'package.json'), 'utf8')
      const pkgJson = JSON.parse(pkgStr)
      expect(Object.keys(pkgJson.jpm.mavenDependencies).length === 0)
    })
})
