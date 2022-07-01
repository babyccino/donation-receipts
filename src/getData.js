var fs = require('fs'); 
var { parse } = require('csv');

let getSalesByCustomer = categories => new Promise((res, rej) => {
  let sales = [];

  let customerList = {};

  const parser = (err, records) => {
    if (err) rej(err);

    for (const record of records) {
      let sale = {
        name: record.Customer,
        gift: {
          total: 0,
          byCategory: {}
        }
      };
      
      let hasCategory = false;
      for (const property in record) {
        if (property == "Customer" || property == "TOTAL" || record[property] == '') continue;
        if (!categories.includes(property)) continue;

        hasCategory = true;
        
        const amount = record[property] == '' ?
          0 :
          Number.parseFloat(record[property].replace(/,/g, ''));

        sale.gift.byCategory[property] = amount;
        sale.gift.total += amount;
      }

      if (hasCategory) {
        sales.push(sale);
        customerList[record.Customer] = true;
      }
    }

    res(sales);
  };
  
  fs.createReadStream(__dirname+'/../data/SalesByCustomer.csv')
    .pipe(parse({ columns: true }, parser));
});

let getCustomers = () => new Promise((res, rej) => {
  var parser = parse({columns: true}, function (err, records) {
    if (err) rej(err);
    
    let customerDict = {};
    for (let customer of records) {
      if (!customer.Customer || customer.Customer === '') continue;
      customerDict[customer.Customer] = customer;
    }

    res(customerDict);
  });
  
  fs.createReadStream(__dirname+'/../data/Customers.csv').pipe(parser);
});

const getData = async categories => {
  const [salesByCustomers, customers] = await Promise.all([getSalesByCustomer(categories), getCustomers()]);
  for (let entry of salesByCustomers) {
    const customer = customers[entry.name];

    if (!customer) continue;
    if (customer["Billing Address"] || customer["Shipping Address"]) {
      entry.billingAddress = customer["Billing Address"] || customer["Shipping Address"];
      entry.shippingAddress = customer["Shipping Address"] || customer["Billing Address"];
    }
    
    if (customer["Email"]) entry.email = customer["Email"];
  }
  
  return salesByCustomers;
}

module.exports = getData;