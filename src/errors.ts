import chalk from 'chalk';

export const ERR_MVN_CONNECTION: Error = new Error(
  `${chalk.red('ERR_MVN_CONNECTION')} Error connecting to Maven.`
);

export const ERR_JPM_EXISTS: Error = new Error(
  `${chalk.red(
    'ERR_JPM_EXISTS'
  )} jpm configuration is presented in package.json.`
);

export const ERR_NOT_JPM_PACKAGE: Error = new Error(
  `${chalk.red(
    'ERR_NOT_JPM_PACKAGE'
  )} Detected non jpm package, use ${chalk.bold(
    '$ jpm init'
  )} to initialize jpm package in current directory.`
);

export const ERR_TARGET_NOT_JPM_PACKAGE: Error = new Error(
  `${chalk.red(
    'ERR_TARGET_NOT_JPM_PACKAGE'
  )} Target dependency is not jpm package, please use node package manager to add the dependency.`
);

export const ERR_NOT_JPM: Error = new Error(
  `${chalk.red('ERR_NOT_JPM')} You must use ${chalk.bold(
    'jpm'
  )} to install this package.`
);

export const ERR_MVN_NOT_FOUND: Error = new Error(
  `${chalk.red('ERR_MVN_NOT_FOUND')} Unable to locate ${chalk.bold(
    'mvn'
  )} installation in system path`
);

export const ERR_POM_PARSING: (reason: string) => Error = (reason: string) =>
  new Error(
    `${chalk.red(
      'ERR_POM_PARSING'
    )} Error parsing pom.xml file. error: ${reason}.`
  );

export const errorProjectNotFound: (reason: string) => Error = (url: string) =>
  new Error(
    `${chalk.red(
      'ERR_PROJECT_NOT_FOUND'
    )} maven Project not found, lookup path: ${url}.`
  );

export const errorImportTarget: (target: string) => Error = (target: string) =>
  new Error(
    `${chalk.red(
      'ERR_IMPORT_TARGET'
    )} Unable to determine repository for: ${target}.`
  );

export const errorDepExistsInPOM: (target: string) => Error = (
  target: string
) =>
  new Error(
    `${chalk.red(
      'DEP_EXISTS_POM'
    )} Dependency exits in local POM for: ${target}.`
  );

export const errorUnsupportedTarget: (target: string) => Error = (
  target: string
) =>
  new Error(
    `${chalk.red(
      'ERR_UNSUPPORTED_IMPORT_TARGET'
    )} unsupported target: ${target}.`
  );

export const errorFileNotFound: (target: string) => Error = (target: string) =>
  new Error(`${chalk.red('ERR_FILE_NOT_FOUND')} unable to locate: ${target}.`);
