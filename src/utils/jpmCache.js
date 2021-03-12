const fs = require("fs-extra")

const JPM_CACHE = {
    exists: () => fs.existsSync('/tmp/.jpmcache'),
    read: () => fs.readJsonSync('/tmp/.jpmcache'),
    write: (cache) => fs.writeFileSync('/tmp/.jpmcache', JSON.stringify(cache)),
    dump: () => fs.removeSync('/tmp/.jpmcache')
}

module.exports = { JPM_CACHE }