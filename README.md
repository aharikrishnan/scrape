# Scrape

Use this project for bootstraping web scrapping

> :warning: **Please read the website T&C before scrapping** as scrapping might not be legal in many countries


### Installation

```bash
  $ git clone https://github.com/aharikrishnan/scrape && cd scrape
  $ npm i
```


### Usage

```bash
Options:
      --version         Show version number                            [boolean]
      --in, --infile    input file containing list of urls to crawl
      --out, --outfile  outout file containing list of urls and corresponding
                        prices
  -h, --help            Show help                                      [boolean]

Examples:
  index.js -in url_list -out url_price_out  extracts price from www.flipkart.com
                                            and www.amazon.in urls
```
