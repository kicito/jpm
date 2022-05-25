/* eslint-disable no-undef */
import { expect, test } from '@oclif/test'

describe('hooks preinstall', () => {
  test
    .stdout()
    .command(['hooks preinstall'])
    .it('runs hello', ctx => {
      expect(ctx.stdout).to.contain('hello world')
    })

  test
    .stdout()
    .command(['hooks preinstall', '--name', 'jeff'])
    .it('runs hello --name jeff', ctx => {
      expect(ctx.stdout).to.contain('hello jeff')
    })
})
