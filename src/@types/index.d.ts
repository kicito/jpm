declare module 'pom-parser' {

export function parse(opts: Partial<{ xmlContent: string; filePath: string; }>, arg1: (err: string, pomResponse: { pomObject: import('../mvn').PomParsingResult.Root; }) => Promise<void>)
}
