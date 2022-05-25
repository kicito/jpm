
import { join } from 'path'
import { tmpdir } from 'os'
import { existsSync, mkdirSync, rmSync } from 'fs'

export const createTestDirIfNotExist = (directory: string): string => {
    const path = join(tmpdir(), 'jpm_test', directory)
    if (!existsSync(path)) {
        mkdirSync(path, { recursive: true })
    }
    return path
}


export const deleteTestDirIfNotExist = () => {
    const path = join(tmpdir(), 'jpm_test')
    if (existsSync(path)) {
        rmSync(path, { recursive: true, force: true })
    }
}