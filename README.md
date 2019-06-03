# nmdr

**N**etease **m**usic **r**ecommendation, not only daily recommendation, FM, random recommendation.

网易云音乐推荐。

项目背景请参阅[这里](./BACKGROUND.md)。

## Develop

```bash
git clone git@github.com:xovel/nmr.git
cd nmr
npm i
node build
```

## Fetch

使用 `node fetch.js` 命令可以从网易云页面获取歌曲信息，支持的方式如下：

```bash
node fetch.js [type]? [id] [options]
```

- type: 操作类型，当前支持 `song` 和 `playlist`，分别表示获取歌曲和播放列表。如果不指定，默认为 `song`，其他非数字值将直接报错。
- id: 一串数字，即当前操作类型的数据编号，可以使用 `--id` 进行指定，支持直接使用具体的链接如 `https://music.163.com/song?id=32807209`，将会截取 `id=` 后面的内容作为标识符
- options: 其他选项
    - options.force 强制拉取新数据
    - options.list `playlist` 模式下逐个获取歌曲信息，该操作有风险，频繁操作会导致网易云封禁爬取，故此设置了一个默认延时，~~但效率不高~~。

## Config

```yml
title: xovel/nmr

style: true
script: true

marked: true
github: true

player:
  mini: false
```

- `title`，指定页面的标题。
- `style`，使用行内样式，如果不指定，则样式将会单独放置到 `./style/index.css` 文件中。
- `script`，使用行内脚本，如果不指定，则脚本将会单独放置到 `./js/index.css` 文件中。
- `marked`，推荐简介部分是否采用 `marked` 进行解析。
- `github`，右上角添加 GitHub 项目地址访问入口。
- `player.mini`，使用小型的播放器。

## Files

```
├─audios/                     # 备用文件夹，存放音频源文件。
├─cache/                      # 缓存 HTML 页面。
├─docs/                       # GitHub Pages
├─pieces/                     # 歌曲关键信息片段
├─scripts/                    #
│  └─index.js                 # 页面脚本
├─sources/                    # 推荐歌曲源
│  ├─0/                       #
│  │  └─eld.yml               #
│  └─2019/                    #
│     ├─1.yml                 #
│     ├─2.yml                 #
│     └─3.yml                 #
├─styles/                     # 样式
│  ├─index.css                # 核心样式
│  ├─listen.css               # 试听样式
│  └─reset.css                # 全局重置样式
├─templates/                  # 模板
│  ├─layout/                  #
│  │  ├─core.pug              # 核心模板
│  │  ├─github.pug            # 右上角 GitHub 入口
│  │  └─head.pug              # head 标签内的内容
│  └─index.pug                # 主页
├─.eslintrc.yml               #
├─.gitignore                  #
├─.npmrc                      #
├─BACKGROUND.md               # 背景简介
├─build.js                    # 构建页面
├─favicon.ico                 # 站点的 favicon 图标
├─fetch.js                    # 拉取歌曲信息
├─LICENSE                     #
├─package.json                #
├─README.md                   #
├─scaffold.yml                # 歌曲的一个简单样板
└─_config.yml                 # 配置文件
```

## Dependencies

```json
...
  "devDependencies": {
    "cheerio": "^1.0.0-rc.3",
    "clean-css": "^4.2.1",
    "js-yaml": "^3.13.1",
    "marked": "^0.6.2",
    "psargv": "0.0.1",
    "pug": "^2.0.3",
    "uglify-js": "^3.5.15"
  }
...
```

- `cheerio`，用于解析网页源码。
- `clean-css`，压缩 CSS。
- `js-yaml`，加载 YAML 文件。
- `marked`，解析 markdown。
- `psargv`，解析命令行参数。
- `pug`，编译 HTML。
- `uglify-js`，压缩 JS。

## License

[MIT](./LICENSE)
