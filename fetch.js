'use strict'

const fs = require('fs')
const path = require('path')

const http = require('http')
const https = require('https')

const cheerio = require('cheerio')

const argv = require('psargv')

function get(url) {
  console.log(`loading data from '${url}'...`)
  return new Promise(function (resolve, reject) {
    (/^https/i.test(url) ? https : http).get(url, function (res) {
      var html = ''

      res.on('data', function (chunk) {
        // chunk is a Buffer instance, use the method toString to get the string
        html += chunk
      });

      res.on('end', function () {
        if (html.indexOf('你要查找的网页找不到') > -1) {
          resolve()
        } else {
          resolve(html)
        }
      });
    }).on('error', function () {
      resolve()
    })
  })
}

function read(filepath) {
  return fs.readFileSync(filepath, 'utf8').toString()
}

function write(dest, content, distFolder = 'pieces') {
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

async function fetch(id, force) {
  let raw
  if (!force && fs.existsSync(path.join('cache', `${id}.html`))) {
    raw = read(path.join('cache', `${id}.html`))
  } else {
    raw = await get(`https://music.163.com/song?id=${id}`)
  }
  if (raw === undefined) {
    throw new Error(`connot fint ${id}`)
  }

  write(`${id}.html`, raw, 'cache')

  const $ = cheerio.load(raw)

  const data = {}

  data.id = id
  data.name = $('meta[property="og:title"]').attr('content').trim()
  data.description = $('meta[property="og:description"]').attr('content').trim()
  data.album = {
    id: $('meta[property="music:album"]').attr('content').split('id=')[1].trim(),
    name: $('meta[property="og:music:album"]').attr('content').trim()
  }
  data.duration = $('meta[property="music:duration"]').attr('content').trim()
  data.artist = $('meta[property="og:music:artist"]').attr('content').split('/').map((item, index) => ({
    id: $('meta[property="music:musician"]').eq(index).attr('content').split('id=')[1].trim(),
    name: item
  }))

  const $mv = $('.u-icn-2')
  if ($mv.length > 0) {
    data.mv = $mv.parent().attr('href').split('id=')[1].trim()
  }

  return data
}

const options = argv(process.argv.slice(2))

function save(data) {
  const ret = []

  if (options.date) {
    ret.push(`date: '${options.date}'\n`)
  }

  ret.push(`id: ${options.id}`)
  ret.push(`name: ${data.name}`)
  ret.push(`duration: ${data.duration}`)
  // ret.push(`description: ${data.description}`)
  ret.push(`artist:`)
  data.artist.forEach(item => {
    ret.push(`  - id: ${item.id}`)
    ret.push(`    name: ${item.name}`)
  })
  ret.push(`album:`)
  ret.push(`  id: ${data.album.id}`)
  ret.push(`  name: ${data.album.name}`)
  if (data.mv) {
    ret.push(`mv: ${data.mv}`)
  }

  write(`${options.id}.yml`, ret.join('\n') + '\n')
}

if (options.id) {
  fetch(options.id, options.force).then(data => save(data)).catch(error => console.log(error))
}
