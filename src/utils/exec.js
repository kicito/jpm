const { exec: _exec } = require('child_process')

const exec = (command) => {
    const _process = _exec(command)
    _process.stdout.on('data', data => {
        console.log(data)
    })

    _process.stderr.on('data', (data) => {
        // console.log('stderr: ' + data.toString())
    })

    _process.on('exit', (code) => {
        // console.log('child process exited with code ' + code.toString())
    })
}

module.exports = { exec }