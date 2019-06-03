'use strict'

const fs = require('fs')
const path = require('path')

const http = require('http')
const https = require('https')

const cheerio = require('cheerio')

class NetEaseMusic {

  constructor({
    debug,
    cacheFolder = 'cache',
    dbPath = 'db.json',
    autoSave
  } = {}) {

    this.dbPath = dbPath
    this.cacheFolder = cacheFolder
    this.autoSave = autoSave

    this.debug = debug

    if (!fs.existsSync(cacheFolder)) {
      fs.mkdirSync(cacheFolder)
    }

    let db = []
    try {
      db = JSON.parse(this.read(dbPath))
    } catch(e) {
      //
    }

    this.list = {
      song: db.song || [],
      mv: db.mv || [],
      playlist: db.playlist || [],
      artist: db.artist || [],
      album: db.album || []
    }
  }

  log(...args) {
    if (this.debug) {
      console.log(...args)
    }
  }

  get(url) {
    const vm = this
    vm.log(`loading data from '${url}'...`)
    return new Promise(function (resolve, reject) {
      (/^https/i.test(url) ? https : http).get(url, function (res) {
        var html = ''

        res.on('data', function (chunk) {
          // chunk is a Buffer instance, use the method toString to get the string
          html += chunk
        });

        res.on('end', function () {
          vm.log(`loaded data from '${url}' done...`)
          vm.write('html/demo/temp.html', html)
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

  read(filepath) {
    return fs.readFileSync(path.join(this.cacheFolder, filepath), 'utf8').toString()
  }

  write(dest, content) {
    const filepath = path.join(this.cacheFolder, dest)
    const filedir = path.dirname(filepath)

    if (!fs.existsSync(filedir)) {
      fs.mkdirSync(filedir, {recursive: true})
    }

    fs.writeFile(filepath, content, err => {
      if (err) throw err
      this.log(`${filepath} write successful!`)
    })
  }

  saveList() {
    this.write(this.dbPath, JSON.stringify(this.list))
  }

  async loadData(options, type = 'song') {

    // if (['song', 'playlist', 'artist', 'album'].indexOf(type) !== -1) {
    //   throw new Error(`Illegal type ${type}`)
    // }

    let raw
    let id = options.id
    if (!id) {
      id = options._[0] === type ? options._[1] : options._[0]
    }
    if (id && id.indexOf('http') === 0) {
      id = id.split('?id=')[1].trim()
    }

    if (!id || !/^\d+$/.test(id)) {
      throw new Error(`required ${type} id`)
    }

    const curPath = `html/${type}/${id}.html`

    if (!options.force && this.list[type].includes(id)) {
      raw = this.read(curPath)
    } else {
      raw = await this.get(`https://music.163.com/${type}?id=${id}`)

      if (!raw) {
        throw new Error(`connot fint ${type} ${id}`)
      }

      this.write(curPath, raw)

      if (!this.list[type].includes(id)) {
        this.list[type].push(id)

        if (this.autoSave) {
          this.saveList()
        }
      }
    }

    if (raw === undefined) {
      throw new Error(`connot fint ${id}`)
    }

    return {
      raw,
      id
    }
  }

  async getSong(options = {}) {

    const {raw , id} = await this.loadData(options, 'song')

    const $ = cheerio.load(raw)

    const data = {}

    if (options.date) {
      data.date = options.date
    }

    if (raw.indexOf('版权保护') !== -1) {
      data.nocopy = true
    }

    data.id = id
    data.name = $('meta[property="og:title"]').attr('content').trim()
    data.description = $('meta[property="og:description"]').attr('content').trim()
    data.album = {
      id: $('meta[property="music:album"]').attr('content').split('id=')[1].trim(),
      name: $('meta[property="og:music:album"]').attr('content').trim()
    }
    data.duration = $('meta[property="music:duration"]').attr('content').trim()
    // data.artist = $('.des.s-fc4 span').attr('title').split(' / ').map((item, index) => ({
    //   id: $('meta[property="music:musician"]').eq(index).attr('content').split('id=')[1].trim(),
    //   name: item
    // }))
    // 修复上面代码中可能出现的乱码解析问题
    data.artist = $('.des.s-fc4 span a').map((index, item) => ({
      id: $(item).attr('href').split('id=')[1].trim(),
      name: $(item).text()
    })).toArray()

    const $mv = $('.u-icn-2')
    if ($mv.length > 0) {
      data.mv = $mv.parent().attr('href').split('id=')[1].trim()
    }

    if (options.save !== false && this.autoSave) {
      this.saveSong(data)
    }

    return data
  }

  _hash(value) {
    if (value.indexOf('#') === -1) {
      return value
    }
    return `"${value}"`
  }

  genSongYML(data, prefix = '') {
    const ret = []

    if (data.date) {
      ret.push(`date: '${data.date}'\n`)
    }

    ret.push(`id: ${data.id}`)
    ret.push(`name: ${this._hash(data.name)}`)

    ret.push(`duration: ${data.duration}`)
    // ret.push(`description: ${data.description}`)
    ret.push(`artist:`)
    data.artist.forEach(item => {
      ret.push(`  - id: ${item.id}`)
      ret.push(`    name: ${this._hash(item.name)}`)
    })
    ret.push(`album:`)
    ret.push(`  id: ${data.album.id}`)
    ret.push(`  name: ${this._hash(data.album.name)}`)
    if (data.mv) {
      ret.push(`mv: ${data.mv}`)
    }
    if (data.nocopy) {
      ret.push('nocopy: true')
    }

    return ret.map(item => prefix + item).join('\n') + '\n'
  }

  saveSong(data) {

    const result = this.genSongYML(data)

    this.log(result)

    this.write(`data/song-${data.id}.yml`, result)
  }

  async getPlaylist(options = {}) {
    const { raw, id } = await this.loadData(options, 'playlist')

    const $ = cheerio.load(raw)

    const data = {id}

    if (options.date) {
      data.date = options.date
    }

    data.song = $('#song-list-pre-cache li a').map((index, item) => ({
      id: $(item).attr('href').split('id=')[1].trim(),
      name: $(item).text()
    })).toArray()

    const len = data.song.length

    data.list = Array(len)

    if (options.list) {
      for (let i = 0; i < len; i++) {
        try {
          let id = data.song[i].id
          if (options.force || !this.list.song.includes(id)) {
            // 给一个延时，避免网易云屏蔽爬取导致所有页面强制视为 404
            // 如果歌单中歌曲过多，任务搁一边，先去喝杯茶什么的
            await this.sleep()
          }
          let curSongData = await this.getSong({id, save: false, force: options.force})
          data.list[i] = this.genSongYML(curSongData, '    ')
        } catch(e) {
          //
        }
      }
    }

    if (this.autoSave) {
      this.savePlaylist(data)
    }

    this.log(data)
  }

  sleep(time = 3000) {
    this.log(`sleep ${time}...`)
    return new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, time)
    })
  }

  savePlaylist(data) {
    const ret = []

    ret.push(`song:`)
    data.song.forEach(item => {
      ret.push('  -')
      ret.push(`    id: ${item.id}`)
      ret.push(`    name: ${this._hash(item.name)}`)
    })

    ret.push(`list:`)
    data.list.forEach(item => {
      ret.push(`  -`)
      ret.push(item)
    })

    const result = ret.join('\n') + '\n'

    this.write(`data/playlist-${data.id}.yml`, result)
  }

}

module.exports = NetEaseMusic
