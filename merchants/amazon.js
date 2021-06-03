const chalk = require('chalk');
const request = require('request');
const cheerio = require('cheerio');

module.exports = {
    scrape: (product => {
        const name = 'amazon.fr';
        const endpoint = 'https://www.amazon.fr/s?k=$q';

        return new Promise((resolve, reject) => {
            let url = endpoint.replace(/\$q/g, product.replace(' ', '+'));

            console.log('Scraping merchant...', chalk.blue(name));

            request(url, {
                followAllRedirects: true
            },(error, response, html) => {
     
                if (error) {
                    console.log(error);
                    reject(error)
                }
                else {
                    const $ = cheerio.load(html);
                    let items = $('div.s-result-item');
                    let products = [];

                    items.each((index, element) => {
            
                        let card = {
                            product: product,
                            name: '',
                            price: 0,
                            merchant: name,
                            available: false
                        };

                        $(element).find('a.a-link-normal').each((i, link) => {
                        
                            let text = $(link).text();
                            let parts = text.trim().split('\n');
            
                            parts.forEach(part => {
                                if (part.length > 0 
                                    && !part.match(/(pc|ordinateur|macbook|cable|backplate|block|hdmi|wasse|Wasserküh)/gi)
                                    && part.match(new RegExp(product, 'ig'))) {
                                    card.name = part.substr(0, 100);
                                }
                            });
                        })

                        if (card.name.length > 0) {
                            let price_tag = $(element).find('span.a-offscreen');
                            let formated = price_tag.text().replace(/\s+/ig, '').replace(',', '.');
                            let price = parseFloat(formated.substr(0, formated.length));
                
                            if (!isNaN(price)) {
                                card.available = true; 
                                card.price = price;
                                products.push(card);
                            }
                        }
                    });

                    resolve(products)
                }
            });
        });
    })
};