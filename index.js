const glob = require('glob');
const chalk = require('chalk');
const readline = require('readline');
const { Table } = require('console-table-printer');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let products = [
    'rtx 2080',
    'rtx 3060', 
    'rtx 3070',
    'rtx 3080',
    'rtx 3090',
];

let list = products.map((p, i) => chalk.blue(i) + ' - ' + p);

let options = {
    products: [],
    filter_not_available: true
};

const q1 = () => {
    return new Promise((resolve, reject) => {
        rl.question('Which card do you want to track ?\n' + list.join('\n') + 
        '\n' + chalk.grey('(Leave empty to select all products)') + '\nChoice: ',
            answer => {
                options.products = answer.length == 0
                    ? Object.keys(products).map(p => parseInt(p))
                    : answer.trim().split(' ');

                resolve();
            })
    })
};

const q2 = () => {
    return new Promise((resolve, reject) => {
        rl.question('Display only in stock products ? ' + chalk.grey('(y)') +' ', answer => {
            options.filter_not_available = answer == 'y' || answer.length == 0;
            resolve();
        });
    })
}

q1().then(() => {
    q2().then(() => {
        rl.close();

        const promises = [];

        const table = new Table({
            columns: [
                { name: 'index', title: '#', alignment: 'left', color: 'blue' },
                { name: 'product', title: 'Product', alignment: 'left' },
                { name: 'name', title: 'Name', alignment: 'left' },
                { name: 'price', title: 'Price', alignment: 'right' },
                { name: 'merchant', title: 'Merchant', alignment: 'left' },
                { name: 'available', title: 'Available', alignment: 'center' },
            ],
        });
        
        options.products.forEach(ans => {
            promises.push(new Promise((resolve, reject) => {
                let product = products.find((p, i) => i == ans);
        
                if (product) {
        
                    glob("./merchants/*.js", function (error, files) {
                        if (error) {
                            reject(error);
                        } else {
                            let results = [];
        
                            files.forEach(file => {
                                const merchant = require(file);
                                results.push(merchant.scrape(product));
                            });
        
                            Promise.all(results).then(data => {
                                const final = [];
        
                                data.forEach(set => {
                                    set.forEach(card => {
                                        final.push(card)
                                    })
                                })
        
                                resolve(final);
                            }).catch(reject)
                        }
                    })
                }
            }));
        })
        
        Promise.all(promises).then(sets => {
        
            let cards = [];
            sets.forEach(set => set.forEach(card => cards.push(card)))
            cards.sort((a, b) => a.price - b.price);
        
            cards.forEach((card, index) => {
                let row = {
                    index,
                    product: card.product,
                    name: card.name,
                    price: card.price.toFixed(2) + ' €',
                    merchant: card.merchant,
                    available: card.available ? 'IN STOCK' : 'OUT OF STOCK'
                };

                if (options.filter_not_available) {
                    if (card.available) {
                        table.addRow(row, { color: card.available ? 'green' : 'white' })
                    } 
                } else {
                    table.addRow(row, { color: card.available ? 'green' : 'white' })
                }
            })
        
            table.printTable();
        }).catch(console.log)
    });
})
