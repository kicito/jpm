
import { exec } from 'shelljs'
import type Artifact from './artifact'
import { join } from 'node:path'
import { readFileSync, accessSync, constants, copyFileSync } from 'node:fs'
import { errorArtifactNotFound } from '../errors'
class MVNLocalRepo {
  path: string
  constructor() {
    this.path = exec('mvn -q help:evaluate -Dexpression=settings.localRepository -DforceStdout', { silent: true }).stdout
  }

  #buildArtifactPath(artifact: Artifact): string {
    return join(this.path, ...artifact.groupID.split('.'), artifact.artifactID, artifact.version)
  }

  isArtifactExists(artifact: Artifact): boolean {
    try {
      accessSync(join(this.#buildArtifactPath(artifact), artifact.getPOMName()), constants.R_OK)
      return true
    } catch (e) {
      return false
    }
  }

  getPOM(artifact: Artifact): string {
    if (this.isArtifactExists(artifact)) {
      return readFileSync(join(this.#buildArtifactPath(artifact), artifact.getPOMName()), 'utf-8')
    } else {
      throw errorArtifactNotFound(artifact.toString())
    }
  }

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
