const chalk = require('chalk');
const request = require('request');
const cheerio = require('cheerio');

module.exports = {
    scrape: (product => {
        const name = 'materiel.net';
        const endpoint =  'https://www.materiel.net/recherche/$q';

        return new Promise((resolve, reject) => {
            let url = endpoint.replace(/\$q/g, encodeURIComponent(product));

            console.log('Scraping merchant...', chalk.blue(name));

            request(url, (error, response, html) => {
                if (error) {
                    console.log(error);
                    reject(error)
                }
                else {
                    const $ = cheerio.load(html);
                    let items = $('li.c-products-list__item');
                    let products = [];

                    items.each((index, element) => {
                        let card = {
                            product: product,
                            name: '',
                            price: 0,
                            merchant: name,
                            available: false
                        };

                        $(element).find('h2.c-product__title').each((i, link) => {
                            let text = $(link).text();
                            let parts = text.trim().split('\n');

                            parts.forEach(part => {
                                if (part.length > 0
                                    && !part.match(/(avis|changer)/gi)
                                    && (part.match(new RegExp(product, 'ig')))) {
                                    card.name = part;
                                }
                            });
                        })

                        if (card.name.length > 0) {
                            let price_tag = $(element).find('span.o-product__price:last-child');
                            card.price = parseFloat(price_tag.text().replace('€', '.').replace(/\s/ig, ''));

                            $(element).find('span.o-availability__value').each((i, stock) => {
                                let text = $(stock).text();
                                let parts = text.trim().split('\n');

                                for (let p of parts) {
                                    if (p.match(/en stock/ig)) {
                                        card.available = true;
                                        break;
                                    }
                                }
                            });

                            products.push(card);
                        }
                    });

                    resolve(products)
                }
            });
        });
    })
};