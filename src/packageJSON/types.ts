export type JSONSchemaForNPMPackageJsonWithJolieSPackageManager = JSONSchemaForNPMPackageJsonWithJolieSPackageManager1 &
  JSONSchemaForNPMPackageJsonWithJolieSPackageManager2
export type JSONSchemaForNPMPackageJsonWithJolieSPackageManager1 = {
  [k: string]: unknown
}
/**
 * A person who has been involved in creating or maintaining this package.
 */
export type Person =
  | {
    name: string
    url?: string
    email?: string
    [k: string]: unknown
  }
  | string
export type PackageExportsEntry =
  | PackageExportsEntryPath
  | PackageExportsEntryObject
/**
 * The module path that is resolved when this specifier is imported. Set to `null` to disallow importing this module.
 */
export type PackageExportsEntryPath = string | null
/**
 * Used to allow fallbacks in case this environment doesn't support the preceding entries.
 */
export type PackageExportsFallback = PackageExportsEntry[]
/**
 * URL to a website with details about how to fund the package.
 */
export type FundingUrl = string
/**
 * Run AFTER the package is published.
 */
export type ScriptsPublishAfter = string
/**
 * Run AFTER the package is installed.
 */
export type ScriptsInstallAfter = string
/**
 * Run BEFORE the package is uninstalled.
 */
export type ScriptsUninstallBefore = string
/**
 * Run BEFORE bump the package version.
 */
export type ScriptsVersionBefore = string
/**
 * Run by the 'npm test' command.
 */
export type ScriptsTest = string
/**
 * Run by the 'npm stop' command.
 */
export type ScriptsStop = string
/**
 * Run by the 'npm start' command.
 */
export type ScriptsStart = string
/**
 * Run by the 'npm restart' command. Note: 'npm restart' will run the stop and start scripts if no restart script is provided.
 */
export type ScriptsRestart = string

export interface JSONSchemaForNPMPackageJsonWithJolieSPackageManager2 {
  /**
   * The name of the package.
   */
  name?: string
  /**
   * Version must be parsable by node-semver, which is bundled with npm as a dependency.
   */
  version?: string
  /**
   * This helps people discover your package, as it's listed in 'npm search'.
   */
  description?: string
  /**
   * This helps people discover your package as it's listed in 'npm search'.
   */
  keywords?: string[]
  /**
   * The url to the project homepage.
   */
  homepage?: string
  /**
   * The url to your project's issue tracker and / or the email address to which issues should be reported. These are helpful for people who encounter issues with your package.
   */
  bugs?:
  | {
    /**
     * The url to your project's issue tracker.
     */
    url?: string
    /**
     * The email address to which issues should be reported.
     */
    email?: string
    [k: string]: unknown
  }
  | string
  /**
   * You should specify a license for your package so that people know how they are permitted to use it, and any restrictions you're placing on it.
   */
  license?: string
  /**
   * DEPRECATED: Instead, use SPDX expressions, like this: { "license": "ISC" } or { "license": "(MIT OR Apache-2.0)" } see: 'https://docs.npmjs.com/files/package.json#license'.
   */
  licenses?: {
    type?: string
    url?: string
    [k: string]: unknown
  }[]
  author?: Person
  /**
   * A list of people who contributed to this package.
   */
  contributors?: Person[]
  /**
   * A list of people who maintains this package.
   */
  maintainers?: Person[]
  /**
   * The 'files' field is an array of files to include in your project. If you name a folder in the array, then it will also include the files inside that folder.
   */
  files?: string[]
  /**
   * The main field is a module ID that is the primary entry point to your program.
   */
  main?: string
  /**
   * The "exports" field is used to restrict external access to non-exported module files, also enables a module to import itself using "name".
   */
  exports?:
  | (string | null)
  | {
    /**
     * The module path that is resolved when the module specifier matches "name", shadows the "main" field.
     */
    '.': PackageExportsEntry | PackageExportsFallback
    /**
     * The module path prefix that is resolved when the module specifier starts with "name/", set to "./*" to allow external modules to import any subpath.
     *
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^\./.+".
     */
    [k: string]: PackageExportsEntry | PackageExportsFallback
  }
  | {
    /**
     * The module path that is resolved when this specifier is imported as a CommonJS module using the `require(...)` function.
     */
    require?: PackageExportsEntry | PackageExportsFallback
    /**
     * The module path that is resolved when this specifier is imported as an ECMAScript module using an `import` declaration or the dynamic `import(...)` function.
     */
    import?: PackageExportsEntry | PackageExportsFallback
    /**
     * The module path that is resolved when this environment is Node.js.
     */
    node?: PackageExportsEntry | PackageExportsFallback
    /**
     * The module path that is resolved when no other export type matches.
     */
    default?: PackageExportsEntry | PackageExportsFallback
    [k: string]: unknown
  }
  | PackageExportsEntry[]
  bin?:
  | string
  | {
    [k: string]: string
  }
  /**
   * When set to "module", the type field allows a package to specify all .js files within are ES modules. If the "type" field is omitted or set to "commonjs", all .js files are treated as CommonJS.
   */
  type?: 'commonjs' | 'module'
  /**
   * Set the types property to point to your bundled declaration file.
   */
  types?: string
  /**
   * Note that the "typings" field is synonymous with "types", and could be used as well.
   */
  typings?: string
  /**
   * The "typesVersions" field is used since TypeScript 3.1 to support features that were only made available in newer TypeScript versions.
   */
  typesVersions?: {
    /**
     * Contains overrides for the TypeScript version that matches the version range matching the property key.
     */
    [k: string]: {
      /**
       * Maps all file paths to the file paths specified in the array.
       */
      '*'?: string[]
    }
  }
  /**
   * Specify either a single file or an array of filenames to put in place for the man program to find.
   */
  man?: string[] | string
  directories?: {
    /**
     * If you specify a 'bin' directory, then all the files in that folder will be used as the 'bin' hash.
     */
    bin?: string
    /**
     * Put markdown files in here. Eventually, these will be displayed nicely, maybe, someday.
     */
    doc?: string
    /**
     * Put example scripts in here. Someday, it might be exposed in some clever way.
     */
    example?: string
    /**
     * Tell people where the bulk of your library is. Nothing special is done with the lib folder in any way, but it's useful meta info.
     */
    lib?: string
    /**
     * A folder that is full of man pages. Sugar to generate a 'man' array by walking the folder.
     */
    man?: string
    test?: string
    [k: string]: unknown
  }
  /**
   * Specify the place where your code lives. This is helpful for people who want to contribute.
   */
  repository?:
  | {
    type?: string
    url?: string
    directory?: string
    [k: string]: unknown
  }
  | string
  funding?:
  | FundingUrl
  | FundingWay
  | [FundingUrl | FundingWay, ...(FundingUrl | FundingWay)[]]
  /**
   * The 'scripts' member is an object hash of script commands that are run at various times in the lifecycle of your package. The key is the lifecycle event, and the value is the command to run at that point.
   */
  scripts?: {
    // /**
    //  * Run code quality tools, e.g. ESLint, TSLint, etc.
    //  */
    // lint?: string | undefined
    // /**
    //  * Run BEFORE the package is published (Also run on local npm install without any arguments).
    //  */
    // prepublish?: string
    // /**
    //  * Run both BEFORE the package is packed and published, and on local npm install without any arguments. This is run AFTER prepublish, but BEFORE prepublishOnly.
    //  */
    // prepare?: string
    // /**
    //  * Run BEFORE the package is prepared and packed, ONLY on npm publish.
    //  */
    // prepublishOnly?: string
    // /**
    //  * run BEFORE a tarball is packed (on npm pack, npm publish, and when installing git dependencies).
    //  */
    // prepack?: string
    // /**
    //  * Run AFTER the tarball has been generated and moved to its final destination.
    //  */
    // postpack?: string
    // /**
    //  * Publishes a package to the registry so that it can be installed by name. See https://docs.npmjs.com/cli/v8/commands/npm-publish
    //  */
    // publish?: string
    // postpublish?: ScriptsPublishAfter
    // /**
    //  * Run BEFORE the package is installed.
    //  */
    // preinstall?: string
    // install?: ScriptsInstallAfter
    // postinstall?: ScriptsInstallAfter
    // preuninstall?: ScriptsUninstallBefore
    // uninstall?: ScriptsUninstallBefore
    // /**
    //  * Run AFTER the package is uninstalled.
    //  */
    // postuninstall?: string
    // preversion?: ScriptsVersionBefore
    // version?: ScriptsVersionBefore
    // /**
    //  * Run AFTER bump the package version.
    //  */
    // postversion?: string
    // pretest?: ScriptsTest
    // test?: ScriptsTest
    // posttest?: ScriptsTest
    // prestop?: ScriptsStop
    // stop?: ScriptsStop
    // poststop?: ScriptsStop
    // prestart?: ScriptsStart
    // start?: ScriptsStart
    // poststart?: ScriptsStart
    // prerestart?: ScriptsRestart
    // restart?: ScriptsRestart
    // postrestart?: ScriptsRestart
    // /**
    //  * Start dev server to serve application files
    //  */
    // serve?: string
    [k: string]: string
  }
  /**
   * A 'config' hash can be used to set configuration parameters used in package scripts that persist across upgrades.
   */
  config?: {
    [k: string]: unknown
  }
  dependencies?: Dependency
  devDependencies?: Dependency
  optionalDependencies?: Dependency
  peerDependencies?: Dependency
  /**
   * When a user installs your package, warnings are emitted if packages specified in "peerDependencies" are not already installed. The "peerDependenciesMeta" field serves to provide more information on how your peer dependencies are utilized. Most commonly, it allows peer dependencies to be marked as optional. Metadata for this field is specified with a simple hash of the package name to a metadata object.
   */
  peerDependenciesMeta?: {
    [k: string]: {
      /**
       * Specifies that this peer dependency is optional and should not be installed automatically.
       */
      optional?: boolean
      [k: string]: unknown
    }
  }
  /**
   * Array of package names that will be bundled when publishing the package.
   */
  bundledDependencies?: string[] | boolean
  /**
   * DEPRECATED: This field is honored, but "bundledDependencies" is the correct field name.
   */
  bundleDependencies?: string[] | boolean
  /**
   * Resolutions is used to support selective version resolutions, which lets you define custom package versions or ranges inside your dependencies. See: https://classic.yarnpkg.com/en/docs/selective-version-resolutions
   */
  resolutions?: {
    [k: string]: unknown
  }
  /**
   * Defines which package manager is expected to be used when working on the current project. This field is currently experimental and needs to be opted-in; see https://nodejs.org/api/corepack.html
   */
  packageManager?: string
  engines?: {
    // node?: string
    [k: string]: string
  }
  engineStrict?: boolean
  /**
   * Specify which operating systems your module will run on.
   */
  os?: string[]
  /**
   * Specify that your code only runs on certain cpu architectures.
   */
  cpu?: string[]
  /**
   * DEPRECATED: This option used to trigger an npm warning, but it will no longer warn. It is purely there for informational purposes. It is now recommended that you install any binaries as local devDependencies wherever possible.
   */
  preferGlobal?: boolean
  /**
   * If set to true, then npm will refuse to publish it.
   */
  private?: boolean | ('false' | 'true')
  publishConfig?: {
    access?: 'public' | 'restricted'
    tag?: string
    registry?: string
    [k: string]: unknown
  }
  dist?: {
    shasum?: string
    tarball?: string
    [k: string]: unknown
  }
  readme?: string
  /**
   * An ECMAScript module ID that is the primary entry point to your program.
   */
  module?: string
  /**
   * A module ID with untranspiled code that is the primary entry point to your program.
   */
  esnext?:
  | string
  | {
    // main?: string
    // browser?: string
    [k: string]: string
  }
  /**
   * Allows packages within a directory to depend on one another using direct linking of local files. Additionally, dependencies within a workspace are hoisted to the workspace root when possible to reduce duplication. Note: It's also a good idea to set "private" to true when using this feature.
   */
  workspaces?:
  | string[]
  | {
    /**
     * Workspace package paths. Glob patterns are supported.
     */
    packages?: string[]
    /**
     * Packages to block from hoisting to the workspace root. Currently only supported in Yarn only.
     */
    nohoist?: string[]
    [k: string]: unknown
  }
  jspm?: JSONSchemaForNPMPackageJsonWithJolieSPackageManager1
  /**
   * Jolie related package dependencies.
   */
  jolie?: {
    /**
     * Dependencies are specified with a simple hash of package name to version range. The version range is a string which has one or more space-separated descriptors. Dependencies can also be identified with a tarball or git URL.
     */
    dependencies?: {
      [k: string]: string
    }
    /**
     * Jolie related tools version this project runs on
     */
    engines?: {
      // jolie?: string
      [k: string]: string
    }
    engineStrict?: boolean
    /**
     * Java related dependencies
     */
    maven?: {
      /**
       * Dependencies are specified with a simple hash of package name to version range. The version range is a string which has one or more space-separated descriptors. Dependencies can also be identified with a tarball or git URL.
       */
      dependencies?: {
        [k: string]: string
      }
      /**
       * Dependencies are specified with a simple hash of package name to version range. The version range is a string which has one or more space-separated descriptors. Dependencies can also be identified with a tarball or git URL.
       */
      indirectDependencies?: {
        [k: string]: string
      }
      [k: string]: unknown
    }
  }
}
/**
 * Used to specify conditional exports, note that Conditional exports are unsupported in older environments, so it's recommended to use the fallback array option if support for those environments is a concern.
 */
export interface PackageExportsEntryObject {
  /**
   * The module path that is resolved when this specifier is imported as a CommonJS module using the `require(...)` function.
   */
  require?: PackageExportsEntry | PackageExportsFallback
  /**
   * The module path that is resolved when this specifier is imported as an ECMAScript module using an `import` declaration or the dynamic `import(...)` function.
   */
  import?: PackageExportsEntry | PackageExportsFallback
  /**
   * The module path that is resolved when this environment is Node.js.
   */
  node?: PackageExportsEntry | PackageExportsFallback
  /**
   * The module path that is resolved when no other export type matches.
   */
  default?: PackageExportsEntry | PackageExportsFallback
  [k: string]: unknown
}
/**
 * Used to inform about ways to help fund development of the package.
 */
export interface FundingWay {
  url: FundingUrl
  /**
   * The type of funding or the platform through which funding can be provided, e.g. patreon, opencollective, tidelift or github.
   */
  type?: string
}
/**
 * Dependencies are specified with a simple hash of package name to version range. The version range is a string which has one or more space-separated descriptors. Dependencies can also be identified with a tarball or git URL.
 */
export interface Dependency {
  [k: string]: string
}
