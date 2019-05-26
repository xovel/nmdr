'use strict'

const fs = require('fs')
const path = require('path')

const pug = require('pug')
const yaml = require('js-yaml')

const CleanCSS = require('clean-css')
const UglifyJS = require("uglify-js")

const distFolder = 'docs'

if (!fs.existsSync(distFolder)) {
  fs.mkdirSync(distFolder)
}

function read(filepath) {
  return fs.readFileSync(filepath, 'utf8').toString()
}

function write(dest, content) {
  const filepath = path.join(distFolder, dest)
  const filedir = path.dirname(filepath)

  if (!fs.existsSync(filedir)) {
    fs.mkdirSync(filedir, {recursive: true})
  }

  fs.writeFile(filepath, content, err => {
    if (err) throw err
    console.log(`${filepath} write successful!`)
  })
}

function loadYML(ymlFilePath) {
  return yaml.safeLoad(read(ymlFilePath))
}

function isDirectory(filepath) {
  try {
    let fileStat = fs.statSync(filepath)
    return fileStat.isDirectory()
  } catch (e) {
    //
    console.error(e)
  }
  return false;
}

const allNMR = loadNMR('sources')

function loadNMR(nmrPath) {
  const ret = []

  const list = fs.readdirSync(nmrPath)

  list.forEach(item => {
    const curPath = path.join(nmrPath, item)
    if (isDirectory(curPath)) {
      ret.push(...loadNMR(curPath))
    } else if (
      path.extname(curPath) === '.yml'
      || path.extname(curPath) === '.yaml'
    ) {
      const item = loadYML(curPath)
      item.artist = [].concat(item.artist)

      if (typeof item.duration === 'number') {
        item.duration = transferDuration(item.duration)
      }

      ret.push(item)
    }
  })

  return ret
}

function transferDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000)
  const minite = Math.floor(seconds / 60)
  let second = seconds % 60
  if (second < 10) {
    second = '0' + second
  }
  return `${minite}:${second}`
}

const config = loadYML('_config.yml')

const indexCompiler = pug.compile(read('templates/index.pug'), {
  filename: 'templates/index.pug',
  // pretty: true
})

fs.copyFileSync('favicon.ico', 'docs/favicon.ico')

const playerOptions = {
  width: 300,
  auto: 1,
  height: 86,
  innerHeight: 66
}

if (config.player) {
  playerOptions.auto = config.player.auto === false ? 0 : 1
  if (config.player.mini) {
    playerOptions.height = 52
    playerOptions.innerHeight = 32
  }
}

const cssOptions = {
  width: playerOptions.width
}

function loadCSS(filepath) {
  return read(filepath).replace(/\$\{([^}]+)\}/g, (_, name) => cssOptions[name] || '')
}

const styleRaw = [
  loadCSS('styles/reset.css'),
  loadCSS('styles/index.css'),
  loadCSS('styles/iframe.css')
].join('\n')

const cleanCSsOptions = {}
const styleContent = new CleanCSS(cleanCSsOptions).minify(styleRaw).styles

const pugData = {
  config,
  list: allNMR
}

if (config.style) {
  pugData.style = styleContent
} else {
  write('style/index.css', styleContent)
}

const jsRaw = read('scripts/index.js').replace(/\$\{([^}]+)\}/g, (_, name) => playerOptions[name] || '')

const uglifyOptions = {}
const jsContent = UglifyJS.minify(jsRaw, uglifyOptions).code

if (config.script) {
  pugData.script = jsContent
} else {
  write('js/index.js', jsContent)
}

const indexContent = indexCompiler(pugData)

write('index.html', indexContent)
