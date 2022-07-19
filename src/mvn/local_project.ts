import { parsePom, Project } from '.';
// import debug from 'debug'
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import xml from 'xml';

// const logger = debug('mvn')

const dependenciesRegex = /<dependencies>[\s\S]*?<\/dependencies>/g
/**
 * Class represents maven Project on current directory 
 *
 * @class LocalProject
 * @extends {Project}
 */
class LocalProject extends Project {

    pomContent?: string

    addDependencies(dep: Project) {
        const elem = []
        this.pom!.dependencies = this.pom!.dependencies ? this.pom!.dependencies : { dependency: [] };
        for (const dep of this.pom!.dependencies!.dependency) {
            elem.push({
                dependency: [
                    { groupId: dep.groupid },
                    { artifactId: dep.artifactid },
                    { version: dep.version }
                ]
            })
        }
        elem.push({
            dependency: [
                { groupId: dep.groupID },
                { artifactId: dep.artifactID },
                { version: dep.version }
            ]
        })
        this.pom?.dependencies?.dependency.push({
            groupid: dep.groupID,
            artifactid: dep.artifactID,
            version: dep.version
        })
        const depsContent = xml({ dependencies: elem }, true)
        this.pomContent = this.pomContent?.replace(dependenciesRegex, depsContent) as string
        writeFileSync('./pom.xml', this.pomContent!)
    }

    static isMavenProject(): boolean {
        return existsSync('./pom.xml')
    }

    static async load(): Promise<LocalProject> {
        const pomContent = readFileSync('./pom.xml',
            { encoding: 'utf8', flag: 'r' });
        const pom = await parsePom({ xmlContent: pomContent })
        const ret = new LocalProject(pom.artifactid, pom.groupid, pom.version)
        ret.pom = pom
        ret.pomContent = pomContent
        return ret
    }
}

export default LocalProject