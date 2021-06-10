const HCCrawler = require('headless-chrome-crawler');
const CSVExporter = require('headless-chrome-crawler/exporter/csv');
const fs = require('fs'); // v 5.0.0

var argv = require('yargs')
  .usage('Usage: $0 [options]')
  .example('$0 -in url_list -out url_price_out', 'extracts price from www.flipkart.com and www.amazon.in urls')
  .alias('i', 'infile')
  .alias('o', 'outfile')
  .nargs('i', 1)
  .describe('i', 'input file containing list of urls to crawl')
  .nargs('o', 1)
  .describe('o', 'outout file containing list of urls and corresponding prices')
  .demandOption([])
  .help('h')
  .alias('h', 'help')
  .epilog('copyright 2021')
  .argv;

var infile = process.stdin
var outfile = argv.outfile
console.log(argv, argv.infile)
if (argv.infile) {
  infile = fs.createReadStream(argv.infile);
}

function extract() {
  debugger
  var domain = window.location.host
  var item_json = {}
  console.log("extracting...", domain)
  var extractAmazon = function() {
    console.log("extracting amazon...")
    var title = document.getElementById('title').innerText.innerText
    var offer_price = document.getElementById("priceblock_ourprice").innerText
    var raw_price = document.getElementById('price').innerText
    var item_json = {
      "type": "Amazon",
      "title": title,
      "offer_price": offer_price,
      "raw_price": raw_price
    }
    return item_json
  }
  var extractFlipkart = function() {
    console.log("extracting flipkart...")
  
    var item_json = {
      "type": "Flipkart",
      "title": document.getElementsByTagName('h1')[0].innerText,
      "offer_price": document.getElementsByClassName('_16Jk6d')[0].innerText,
      "raw_price": document.getElementsByClassName('_16Jk6d')[0].innerText
    }
    return item_json
  }
  if (domain == 'www.amazon.in') {
    item_json = extractAmazon()
  }
  else if (domain == 'www.flipkart.com') {
    item_json = extractFlipkart()
  }
  debugger
  return item_json
}


const exporter = new CSVExporter({
  file: outfile,
  fields: ['result.type', 'response.url', 'response.status', 'result.title', 'result.offer_price', 'result.raw_price'],
  separator: "\t"
});

(async () => {
  const crawler = await HCCrawler.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: false,
    evaluatePage: extract,
    waitUntil: 'networkidle2',
    retryCount: 0,
    jQuery: false,
    requestfailed: (err) => {
      console.err("Request failed! ", err)
    },
    exporter
  });

  infile.on('data', async function (buf) {
    buf.toString().split(/\n/).forEach(async function (url) {
      if (url.trim().length) {
        await crawler.queue(url);
      }
    })
  });
  await crawler.onIdle();
  await crawler.close();
})();

