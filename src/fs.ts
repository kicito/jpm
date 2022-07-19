import { existsSync, mkdirSync } from 'fs'
export const mkdirIfNotExist = (path: string) => {
    if (!existsSync(path)) {
        mkdirSync(path, { recursive: true })
    }
}