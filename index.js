var urlparse =require('url');
const puppeteer = require('puppeteer');
const fs = require('fs'); // v 5.0.0
const fse = require('fs-extra'); // v 5.0.0
const path = require('path');
const crypto = require('crypto');
const stringify = require('csv-stringify')

var argv = require('yargs')
  .usage('Usage: $0 [options]')
  .example('$0 -in url_list -out url_price_out'  , 'extracts price from www.flipkart.com and www.amazon.in urls')
  .alias('in', 'infile')
  .alias('out', 'outfile')
  .nargs('in', 1)
  .describe('in', 'input file containing list of urls to crawl')
  .nargs('out', 1)
  .describe('out', 'outout file containing list of urls and corresponding prices')
  .demandOption([])
  .help('h')
  .alias('h', 'help')
  .epilog('copyright 2021')
  .argv;

var infile = process.stdin
var outfile = process.stdout

if(argv.infile){
  infile = fs.createReadStream(argv.infile);
}

if(argv.outfile){
  outfile = fs.createWriteStream(argv.outfile, {flags:'a+'});
}

//var hash = crypto.createHash('md5').update(name).digest('hex');

async function getBrowser(){
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome'
  });
  return browser
}


async function getPage(browser){
  const iPhone = puppeteer.devices['iPhone 6'];
  let page = await browser.newPage();
  await page.emulate(iPhone);
  let responseHandler = async (response) => {
    const status = response.status()
    const url = new URL(response.url());

    if (response.headers()['content-type'] != 'text/html') {
      //console.log('[SKIP] ', url.href)
      return
    }
    if ((status >= 300) && (status <= 399) || response.headers()['content-type'] != 'text/html') {
      //console.log('[SKIP] ', response.url(), 'to', response.headers()['location'])
      return
    }

    console.error('[SAVE] ', url.href)

    let filePath = path.resolve(`./output${url.pathname}`);
    if (path.extname(url.pathname).trim() === '') {
      filePath = `${filePath}/index.html`;
    }
    await fse.outputFile(filePath, await response.buffer());
  }

  page.on('response', responseHandler);
  return page
}

async function crawl(browser, amazonPage, flipkartPage, url) {

  let domain = urlparse.parse(url).hostname
  console.time(url)
  if(domain == 'www.amazon.in'){
    await crawlAmazon(browser, amazonPage, url)
  }
  else if(domain == 'www.flipkart.com'){
    await crawlFlipkart(browser, flipkartPage, url)
  }
  console.timeEnd(url)

}
async function crawlAmazon(browser, page, url) {
  await page.goto(url, {
    waitUntil: 'networkidle2'
  });


  let item_json = {
    "marketplace_type": "Amazon",
    "url": url,
    "raw_price": await getAmazonPrice(page, url)
  }
  await writeStream(outfile, item_json)
}

async function getAmazonPrice(page){
  await page.waitForSelector('#price')
  const price = await page.$eval('#price', (e) => e.innerText);
  return price
}

async function crawlFlipkart(browser, page, url) {
  await page.goto(url, {
    waitUntil: 'networkidle2'
  });

  let item_json = {
    "marketplace_type": "Flipkart",
    "url": url,
    "raw_price": await getFlipkartPrice(page, url)
  }
  await writeStream(outfile, item_json)
}

async function getFlipkartPrice(page){
  await page.waitForSelector('.Lto0P5')
  const price = await page.$eval('.Lto0P5', (e) => e.innerHTML);
  return price
}

async function writeStream(stream, json){
  console.error('[EXTRACT]', json)
  stringify([ json ],{ columns: ['marketplace_type', 'url', 'raw_price'] }, async function(err, records){
    await stream.write(records)
  })
}

async function main(){
  const browser = await getBrowser()
  const amazonPage = await getPage(browser)
  const flipkartPage = await getPage(browser)

  infile.on('data', function (buf) {
    buf.toString().split(/\n/).forEach(function(url){
      crawl(browser, amazonPage, flipkartPage, url.trim())
    })
  });


  setTimeout(async () => {
    await browser.close();
  }, 10 * 1000);
}

main()
