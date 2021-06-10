const HCCrawler = require('headless-chrome-crawler');
const CSVExporter = require('headless-chrome-crawler/exporter/csv');
const fs = require('fs'); // v 5.0.0

var argv = require('yargs')
  .usage('Usage: $0 [options]')
  .example('$0 -in url_list -out url_price_out', 'extracts price from www.flipkart.com and www.amazon.in urls')
  .alias('i', 'infile')
  .alias('o', 'outfile')
  .alias('d', 'delay')
  .alias('c', 'maxConcurrency')
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
argv.delay = argv.delay || 5 * 100
argv.maxConcurrency = argv.maxConcurrency || 5

function extract() {
  var domain = window.location.host
  var item_json = {}
  console.log("extracting...", domain)
  var extractAmazon = function() {
    console.log("extracting amazon...")
    var item_json = {
      "type": "Amazon",
      "title": document.getElementById('title').innerText,
      "offer_price": document.getElementById("priceblock_ourprice").innerText,
      "raw_price": document.getElementById('price').innerText
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
  return item_json
}


const exporter = new CSVExporter({
  file: outfile,
  fields: ['result.type', 'response.url', 'response.status', 'result.title', 'result.offer_price', 'result.raw_price'],
  separator: "\t"
});

(async () => {
  const crawler = await HCCrawler.launch({
    delay: argv.delay,
    maxConcurrency: argv.maxConcurrency,
    executablePath: '/usr/bin/google-chrome',
    headless: false,
    evaluatePage: extract,
    waitUntil: 'networkidle2',
    retryCount: 0,
    jQuery: false,
    customCrawl: async (page, crawl) => {
      // You can access the page object before requests
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (['image', 'stylesheet', 'font','other'].includes(request.resourceType())) {
          request.abort();
        } else {
            request.continue();
        }
      });
      // The result contains options, links, cookies and etc.
      const result = await crawl();
      // You need to extend and return the crawled result
      return result;
    },
    onSuccess: result => {
      console.log(`Crawled ${result.options.url}.`);
    },
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

