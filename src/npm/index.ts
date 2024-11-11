export { default as Package } from './package';

/**
 * Guess the target if it is an npm hosted package
 *
 * @param {string} _target target package name
 * @return {boolean}
 */
 
export const guessIfNPMPackage = (_target: string): boolean => {
  return true;
};
