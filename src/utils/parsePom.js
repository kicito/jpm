const pomParser = require("pom-parser");
// const util = require("util");

const parsePom = (opts) =>
    new Promise(
        (resolve, reject) => {
            pomParser.parse(opts, function (err, pomResponse) {
                if (err) {
                    console.log("ERROR: " + err);
                    reject()
                    return;
                }

                let mvnDependencies = {}

                const parseDep = (dependency, properties) => {
                    const {
                        groupid: groupId,
                        artifactid: artifactId,
                        scope, optional, version
                    } = dependency

                    if (!optional
                        && groupId !== "org.jolie-lang"
                        && !["test", "compile"].includes(scope)) {
                        const regex = /\{(.*?)\}/;
                        const matched = regex.exec(version);

                        mvnDependencies[`${groupId}:${artifactId}`] = (matched && properties[matched[1]]) ? properties[matched[1]] : version
                    }
                }

                const { pomObject } = pomResponse

                // console.log(util.inspect(pomObject, true, null))

                if (!pomObject) {
                    console.log({ pomResponse })
                    return
                }

                const dependencies = pomResponse.pomObject.project.dependencymanagement?.dependencies || pomResponse.pomObject.project.dependencies

                if (dependencies) {
                    const { dependency } = dependencies

                    dependency.hasOwnProperty("length")
                        ? dependencies.dependency.forEach(dependency => parseDep(dependency, pomObject.project.properties))
                        : parseDep(dependencies.dependency, pomObject.project.properties)
                }

                resolve({
                    dependencies: mvnDependencies,
                    pomObject
                })

            })
        }
    );


module.exports = { parsePom }