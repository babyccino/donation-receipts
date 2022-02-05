var fs = require('fs'); 
var { parse } = require('csv-parse');

//       donor = {
//         name,
//         address,
//         gift: {
//           total,
//           byCategory: [
//             {category: total}, ...
//           ]
//         }
//       };

let getSalesByCustomer = () => new Promise((res, rej) => {
  var parser = parse({columns: true}, function (err, records) {
    if (err) rej(err);
    
    let sales = [];
    for (const record of records) {
      let sale = {
        name: record.Customer,
        gift: {
          total: Number.parseFloat(record.TOTAL.replace(/,/g, '')),
          byCategory: {}
        }
      };
      
      for (const property in record) {
        if (property == "Customer" || property == "TOTAL" || record[property] == '') continue;
        
        sale.gift.byCategory[property] =
          record[property] == '' ?
          0 :
          Number.parseFloat(record[property].replace(/,/g, ''));
      }

      sales.push(sale);
    }

    res(sales);
  });
  
  fs.createReadStream(__dirname+'/SalesByCustomer.csv').pipe(parser);
});

let getCustomers = () => new Promise((res, rej) => {
  var parser = parse({columns: true}, function (err, records) {
    if (err) rej(err);
    
    let customerDict = {};
    for (let customer of records) customerDict[customer.Customer] = customer;

    res(customerDict);
  });
  
  fs.createReadStream(__dirname+'/Customers.csv').pipe(parser);
});

const getData = async () => {
  const [salesByCustomers, customers] = await Promise.all([getSalesByCustomer(), getCustomers()]);
  for (let entry of salesByCustomers) {
    const customer = customers[entry.name];

    if (customer["Billing Address"] || customer["Shipping Address"]) {
      entry.billingAddress = customer["Billing Address"] || customer["Shipping Address"];
      entry.shippingAddress = customer["Shipping Address"] || customer["Billing Address"];
    }
    
    if (customer["Email"]) entry.email = customer["Email"];
  }
  
  return salesByCustomers;
}

module.exports = getData;