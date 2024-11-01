import { errorImportTarget } from './errors';
import { guessIfMVNPackage, Project } from './mvn';
import { guessIfNPMPackage, Package } from './npm';
import { existsSync } from 'node:fs';

export type RepoType = 'mvn' | 'npm' | 'local'



const isLocalDir = (target: string): boolean => {
    return existsSync(target);
};

/**
 * Guess repository to retrieve the library
 *
 * @param {string} target
 * @return {RepoType}
 */
export const guessRepo = (target: string): RepoType => {
    if (isLocalDir(target)){
        return 'local';
    }

    if (guessIfMVNPackage(target)) {
        return 'mvn';
    }

    if (guessIfNPMPackage(target)) {
        return 'npm';
    }


    throw errorImportTarget(target);
};

export const buildProjectFromTarget = (target: string): Project => {
    return new Project(target);
};

export const buildPackageFromTarget = (target: string): Package => {
    return new Package(target);
};

export const isWindows = (): boolean => {
    return process.platform === 'win32'|| /^(msys|cygwin)/.test(process.env['OSTYPE'] || '');
};