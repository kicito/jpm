
import { exec } from 'shelljs'
import type Artifact from './artifact'
import { join } from 'node:path'
import { readFileSync, accessSync, constants, copyFileSync } from 'node:fs'
import { errorArtifactNotFound } from '../errors'

/**
 * Defined class to manage maven dependency stored in local machine
 *
 * @class MVNLocalRepo
 */
class MVNLocalRepo {
  path: string
  constructor() {
    this.path = exec('mvn -q help:evaluate -Dexpression=settings.localRepository -DforceStdout', { silent: true }).stdout
  }

  /**
   * Build system path to the Artifact on local machine
   *
   * @param {Artifact} artifact
   * @return {string} path to Artifacts
   * @memberof MVNLocalRepo
   */
  #buildArtifactPath(artifact: Artifact): string {
    return join(this.path, ...artifact.groupID.split('.'), artifact.artifactID, artifact.version)
  }

  /**
   * Check if the Artifact is downloaded to the local repository
   *
   * @param {Artifact} artifact
   * @return {boolean}
   * @memberof MVNLocalRepo
   */
  isArtifactExists(artifact: Artifact): boolean {
    try {
      accessSync(join(this.#buildArtifactPath(artifact), artifact.getPOMName()), constants.R_OK)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Retrieve pom file from local repository
   *
   * @param {Artifact} artifact
   * @return {*}  {string}
   * @memberof MVNLocalRepo
   */
  getPOM(artifact: Artifact): string {
    if (this.isArtifactExists(artifact)) {
      return readFileSync(join(this.#buildArtifactPath(artifact), artifact.getPOMName()), 'utf-8')
    } else {
      throw errorArtifactNotFound(artifact.toString())
    }
  }

  /**
   * Copy Jar of the artifact to destination
   *
   * @param {Artifact} artifact
   * @param {string} destination
   * @return {void} 
   * @throws {ERR_ARTIFACT_NOT_FOUND} If artifact is not exists
   * @memberof MVNLocalRepo
   */
  downloadJAR(artifact: Artifact, destination: string) {
    if (this.isArtifactExists(artifact)) {
      return copyFileSync(join(this.#buildArtifactPath(artifact), artifact.getDistJAR()), destination)
    } else {
      throw errorArtifactNotFound(artifact.toString())
    }
  }
}

const localRepo = new MVNLocalRepo()

export default localRepo
