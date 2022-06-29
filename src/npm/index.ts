export { default as Package } from './package'

/**
 * Guess the target if it is an npm hosted package
 *
 * @param {string} _target target package name
 * @return {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const guessIfNPMPackage = (_target: string): boolean => {
  return true
}
