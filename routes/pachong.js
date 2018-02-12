var express = require('express')
var router = express.Router()
//nodejs里一个非常方便的客户端请求代理模块
const request = require('superagent')
//为服务器特别定制的，快速、灵活、实施的jQuery核心实现
const cheerio = require('cheerio')
//丰富了fs模块，同时支持async/await
const fs = require('fs-extra')

const path = require('path')

let url = 'http://www.mmjpg.com/tag/meixiong/'

async function getUrl () {
  const res = await request.get(url + 1)
  const $ = cheerio.load(res.text)
  $('.pic li').each(function (i, elem) {
    const href = $(this).find('a').attr('href')
    const title = $(this).find('.title').text()
    console.log(title, href)
  })
}

//这样写不行
async function getPage () {
  let res = await request.get(url + 1)
  const $ = cheerio.load(res.text)
  $('.info').each(function (i, elem) {
    const str = $(this).text()
    const page = parseInt(str.replace(/[^0-9]/ig, ''))
    console.log(page)
    return page
  })
}

async function getPage1 () {
  return  new Promise(async resolve => {
    let res = await request.get(url + 1)
    const $ = cheerio.load(res.text)
    $('.info').each(function (i, elem) {
      const str = $(this).text()
      const page = parseInt(str.replace(/[^0-9]/ig, ''))
      console.log(page)
      resolve(page)
    })
  })
}
//这样写却可以
async function getP () {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(36)
    }, 2000)
  })

}

async function getnewUrl () {
  let linkArr = []
  const page = await getPage1()

  for (let i = 1; i <= page; i++) {
    const res = await request.get(url + i)
    const $ = cheerio.load(res.text)
    $('.pic li').each(function (i, elem) {
      let link = $(this).find('a').attr('href')
      linkArr.push(link)
    })
  }

  return linkArr
}



//不管用
async function getnewUrl1 () {
  let urlArr = []
  let linkArr = []
  const page = await getPage1()

  for (let i = 1; i <= page; i++) {
    urlArr.push(url + i)
  }
  const urlPromises = getAllPromise(urlArr)


  for (const urlPromise of urlPromises) {
    console.log(urlPromise)
    const $ = cheerio.load(urlPromise)
    $('.pic li').each(function (i, elem) {
      let link = $(this).find('a').attr('href')
      linkArr.push(link)
    })
  }


  return linkArr
}

async function getAllPromise (urlArr) {
  const urlPromises = urlArr.map(async url => {
    const response = await request.get(url)
    return response.text();
  })
  return Promise.all(urlPromises)
}


async function getPic (url) {
  const res = await request.get(url)
  const $ = cheerio.load(res.text)
  // 以图集名称来分目录
  const dir = $('.article h2').text()
  console.log(`创建${dir}文件夹`)
  await fs.mkdirs(path.join(__dirname, '/mm', dir))
  const pageCount = parseInt($('#page .ch.all').prev().text())
  for (let i = 1; i <= pageCount; i++) {
    let pageUrl = url + '/' + i
    const data = await request.get(pageUrl)
    const _$ = cheerio.load(data.text)
    // 获取图片的真实地址
    const imgUrl = _$('#content img').attr('src')
    download(dir, imgUrl)
  }
}

function download(dir, imgUrl) {
  console.log(`正在下载${imgUrl}`)
  const filename = imgUrl.split('/').pop()
  const req = request.get(imgUrl)
    .set({ 'Referer': 'http://www.mmjpg.com' }) // mmjpg.com根据Referer来限制访问
  req.pipe(fs.createWriteStream(path.join(__dirname, 'mm', dir, filename)))
}



async function main () {
  const urls = await getnewUrl()

  for (let url of urls) {
    await getPic(url)
  }
}

main()

// 你就可以看见HTML内容打印到了控制台

router.get('/', function (req, res, next) {
  res.send(res.text)
})

module.exports = router
