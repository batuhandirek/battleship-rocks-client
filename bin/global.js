#!/usr/bin/env node
const commandLineArgs = require('command-line-args')

const optionDefinitions = [
    { name: 'version', alias: 'v', type: Boolean },
]

const options = commandLineArgs(optionDefinitions)
if(options.version) {
    const package = require(`${__dirname}/../package.json`)
    console.log(package)
    console.log('Battleship v1.0.1')
}
else {
    require('../dist/bundle')
}
