/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { parsePom, Project } from '.';
// import debug from 'debug'
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import xml from 'xml';
import { errorDepExistsInPOM } from '../errors';

// const logger = debug('mvn')

const dependenciesRegex = /<dependencies>[\s\S]*?<\/dependencies>/g;
/**
 * Class represents maven Project on current directory 
 *
 * @class LocalProject
 * @extends {Project}
 */
class LocalProject extends Project {

    pomContent?: string;

    #buildDependenciesXMLObject(): xml.XmlObject {
        const elem = [];
        for (const dep of this.pom!.dependencies!.dependency) {
            elem.push({
                dependency: [
                    { groupId: dep.groupid },
                    { artifactId: dep.artifactid },
                    { version: dep.version }
                ]
            });
        }
        return { dependencies: elem };
    }

    addDependencies(dep: Project) {
        this.pom!.dependencies = this.pom!.dependencies ? this.pom!.dependencies : { dependency: [] };
        const exists = this.pom!.dependencies.dependency.find(d => d.artifactid === dep.artifactID && d.groupid === dep.groupID);
        if (exists) {
            throw errorDepExistsInPOM(dep.toString());
        }
        this.pom!.dependencies.dependency.push({
            groupid: dep.groupID,
            artifactid: dep.artifactID,
            version: dep.version
        });
        const depsContent = xml(this.#buildDependenciesXMLObject(), true);
        this.pomContent = this.pomContent?.replace(dependenciesRegex, depsContent) as string;
        writeFileSync('./pom.xml', this.pomContent!);
    }

    removeDependencies(dep: Project) {
        this.pom!.dependencies = this.pom!.dependencies ? this.pom!.dependencies : { dependency: [] };
        this.pom!.dependencies.dependency = this.pom!.dependencies.dependency.filter(d => d.artifactid !== dep.artifactID && d.groupid !== dep.groupID);
        const depsContent = xml(this.#buildDependenciesXMLObject(), true);
        this.pomContent = this.pomContent?.replace(dependenciesRegex, depsContent) as string;
        writeFileSync('./pom.xml', this.pomContent!);
    }

    static isMavenProject(): boolean {
        return existsSync('./pom.xml');
    }

    static async load(): Promise<LocalProject> {
        const pomContent = readFileSync('./pom.xml',
            { encoding: 'utf8', flag: 'r' });
        const pom = await parsePom({ xmlContent: pomContent });
        const ret = new LocalProject(pom.artifactid, pom.groupid, pom.version);
        ret.pom = pom;
        ret.pomContent = pomContent;
        return ret;
    }
}

export default LocalProject;