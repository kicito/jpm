const pomParser = require("pom-parser");

const parsePom = (opts) =>
    new Promise(
        (resolve, reject) => {
            pomParser.parse(opts, function (err, pomResponse) {
                if (err) {
                    console.log("ERROR: " + err);
                    return;
                }

                let mvnDependencies = {}

                pomResponse.pomObject.project.dependencies.dependency
                    .forEach(({ groupid: groupId, scope, version, artifactid: artifactId }) => {
                        if (groupId !== "org.jolie-lang" && !["test", "compile"].includes(scope)) {
                            mvnDependencies[`${groupId}:${artifactId}`] = version
                        }
                    })

                resolve(mvnDependencies)

            })
        }
    );


module.exports = { parsePom }