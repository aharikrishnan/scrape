# Scrape

Use this project for bootstraping web scrapping

> :warning: **Please read the website T&C before scrapping** as scrapping is not legal in many countries


### Installation

- Prerequisite: node / npm. Follow installation procedure at https://github.com/tj/n#installation

- Install required dependencies

```bash
  git clone https://github.com/aharikrishnan/scrape \
    && cd scrape \
    && npm i
```


### Usage

```bash
$ node index.js --help

Options:
      --version         Show version number                            [boolean]
      -i, --infile    input file containing list of urls to crawl
      -o, --outfile  outout file containing list of urls and corresponding
                        prices
  -h, --help            Show help                                      [boolean]

Examples:
  index.js -i url_list -o url_price_out  extracts price from www.flipkart.com
                                            and www.amazon.in urls
```


