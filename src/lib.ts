import { errorImportTarget } from './errors'
import { guessIfMVNPackage, Project } from './mvn'
import { guessIfNPMPackage, Package } from './npm'


export type RepoType = 'mvn' | 'npm'

/**
 * Guess repository to retrieve the library
 *
 * @param {string} target
 * @return {RepoType}
 */
export const guessRepo = (target: string): RepoType => {
    if (guessIfMVNPackage(target)) {
        return 'mvn'
    }

    if (guessIfNPMPackage(target)) {
        return 'npm'
    }

    throw errorImportTarget(target)
}

export const buildProjectFromTarget = (target: string): Project => {
    return new Project(target)
}

export const buildPackageFromTarget = (target: string): Package => {
    return new Package(target)
}