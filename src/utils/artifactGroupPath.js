const groupPath =
    ({ groupId, artifactId, version }) =>
        `${groupId.replace(/\./g, '/')}/${artifactId}/${version}`

module.exports = { groupPath }