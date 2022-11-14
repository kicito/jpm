
import { exec } from 'shelljs';
import type Project from './project';
import { join } from 'node:path';
import { readFileSync, accessSync, constants, copyFileSync } from 'node:fs';
import { errorProjectNotFound } from '../errors';

/**
 * Defined class to manage maven dependency stored in local machine
 *
 * @class MVNLocalRepo
 */
class MVNLocalRepo {
  path: string;
  constructor() {
    this.path = exec('mvn -q help:evaluate -Dexpression=settings.localRepository -DforceStdout', { silent: true }).stdout;
  }

  /**
   * Build system path to the Project on local machine
   *
   * @param {Project} project
   * @return {string} path to Projects
   * @memberof MVNLocalRepo
   */
  #buildProjectPath(project: Project): string {
    return join(this.path, ...project.groupID.split('.'), project.artifactID, project.version);
  }

  /**
   * Check if the Project is downloaded to the local repository
   *
   * @param {Project} project
   * @return {boolean}
   * @memberof MVNLocalRepo
   */
  isProjectExists(project: Project): boolean {
    try {
      accessSync(join(this.#buildProjectPath(project), project.getPOMName()), constants.R_OK);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Retrieve pom file from local repository
   *
   * @param {Project} project
   * @return {*}  {string}
   * @memberof MVNLocalRepo
   */
  getPOM(project: Project): string {
    if (this.isProjectExists(project)) {
      return readFileSync(join(this.#buildProjectPath(project), project.getPOMName()), 'utf-8');
    } else {
      throw errorProjectNotFound(project.toString());
    }
  }

  /**
   * Copy Jar of the project to destination
   *
   * @param {Project} project
   * @param {string} destination
   * @return {void} 
   * @throws {ERR_ARTIFACT_NOT_FOUND} If project is not exists
   * @memberof MVNLocalRepo
   */
  downloadJAR(project: Project, destination: string) {
    if (this.isProjectExists(project)) {
      return copyFileSync(join(this.#buildProjectPath(project), project.getDistJAR()), destination);
    } else {
      throw errorProjectNotFound(project.toString());
    }
  }
}

const localRepo = new MVNLocalRepo();

export default localRepo;
