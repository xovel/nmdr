'use strict'

const psargv = require('psargv')

const options = psargv(process.argv.slice(2))

const NetEaseMusic = require('./netease')

const nmr = new NetEaseMusic({debug: true, autoSave: true})

let type = options._[0]

if (/^\d+$/.test(type)) {
  type = 'song'
}

switch (type) {
  case 'song':
    nmr.getSong(options).catch(error => console.log(error))
    break
  case 'playlist':
    nmr.getPlaylist(options).catch(error => console.log(error))
    break
  default:
    throw new Error(`Unknown operation ${type}`)
}
