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

const HCCrawler = require('headless-chrome-crawler');
const CSVExporter = require('headless-chrome-crawler/exporter/csv');


const exporter = new CSVExporter({
  file: outfile,
  fields: ['response.url', 'response.status', 'result.title', 'result.price', 'result.raw_price'],
});

(async () => {
  const crawler = await HCCrawler.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: false,
    evaluatePage: () => ({
      title: '',
      price: '',
      raw_price: ''
    }),
    exporter
  });
  infile.on('data', function (buf) {
    buf.toString().split(/\n/).forEach(function (url) {
      crawler.queue(url);
    })
  });
  await crawler.onIdle();
  await crawler.close();
})();

