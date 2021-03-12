const { JPM_JSON } = require("./jpmJson")

function updateJpmJson({ pkgRepo, pkgName, version }) {
    let jpmJson = JPM_JSON.read()

    jpmJson = {
        ...jpmJson,
        dependencies: {
            ...jpmJson.dependencies,
            [pkgRepo]: (() => {
                switch (pkgRepo) {
                    // case 'mvn': 
                    //     const [groupId, artifactId, version] = pkgName.split(':')
                    //     return { groupId, artifactId, version }
                    case 'jpm':
                        return {
                            ...jpmJson.dependencies.jpm,
                            [pkgName]: version
                        }

                }
            })()
        }
    }

    JPM_JSON.write(jpmJson)
}

module.exports = { updateJpmJson }