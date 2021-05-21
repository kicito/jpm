const pomParser = require("pom-parser");
const util = require("util");

const parsePom = (opts) =>
    new Promise(
        (resolve, reject) => {
            pomParser.parse(opts, async function (err, pomResponse) {
                if (err) {
                    console.log("ERROR: " + err);
                    reject()
                    return;
                }

                let mvnDependencies = {}

                const parseDep = (dependency, properties, projectVersion) => {
                    const {
                        groupid: groupId,
                        artifactid: artifactId,
                        scope, optional, version
                    } = dependency

                    if (!optional
                        && groupId !== "org.jolie-lang"
                        && !["test", "compile"].includes(scope)) {

                        if (version === '${project.version}') return projectVersion

                        const regex = /\{(.*?)\}/;
                        const matched = regex.exec(version);

                        const match = matched && properties[matched[1]]

                        // console.log("PROJECT_V" + projectVersion)
                        // console.log(version + "MATCHED" + match + matched)
                        // match && console.log(match === 'project.version')

                        const _version = !match
                            ? version
                            : properties[matched[1]]

                        if (!version) return

                        mvnDependencies[`${groupId}:${artifactId}`] = _version
                    }
                }

                const { pomObject } = pomResponse

                // console.log(util.inspect(pomObject, true, null))

                if (!pomObject) {
                    console.log({ pomResponse })
                    return
                }

                const properties = await mergeParentProperties(pomObject.project.properties, pomObject.project.parent)

                const dependencies = pomResponse.pomObject.project.dependencymanagement?.dependencies || pomResponse.pomObject.project.dependencies

                if (dependencies) {
                    const { dependency } = dependencies

                    dependency.hasOwnProperty("length")
                        ? dependencies.dependency.forEach(dependency => parseDep(dependency, properties, pomObject.project.version))
                        : parseDep(dependencies.dependency, properties, pomObject.project.version)
                }

                resolve({
                    dependencies: mvnDependencies,
                    pomObject
                })

            })
        }
    );


module.exports = { parsePom }

const { makeMvnArtifactJson } = require("./makeMvnArtifactJson");

const mergeParentProperties = async (_properties, _parent) => {

    if (!_parent) return _properties;

    let properties = { ..._properties }
    let parent = { groupId: _parent.groupid, artifactId: _parent.artifactid, version: _parent.version }

    // console.log({ parent, properties })

    if (parent) {
        let parsedParent = await makeMvnArtifactJson(parent)

        while (parsedParent && parsedParent.properties) {
            properties = { ...parsedParent.properties, ...properties }
            parsedParent = parsedParent.parent ? await makeMvnArtifactJson(parsedParent.parent) : null
        }
    }

    console.log("PROPERTIES: " + util.inspect(properties))
    return properties
}