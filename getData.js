var fs = require('fs'); 
var { parse } = require('csv-parse');

//       donor = {
//         name: 'Jeff Jeffersonison',
//         address: 'McNamee Pl',
//         gift: {
//           total: 1000,
//           byCategory: [
//             {name: "M&S", total: 100},
//             {name: "local", total: 900}
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
        if (property == "Customer" || property == "TOTAL") continue;
        
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
    for (let customer of records) {
      customer.Customer = customer.Customer.replace(/[0-9]/g, '').trim();
      if (customer.Customer.indexOf(',') != -1) {
        const names = customer.Customer.split(', ');
        customer.Customer = names[1] + ' ' + names[0];
      }
      customerDict[customer.Customer] = customer;
    }

    res(customerDict);
  });
  
  fs.createReadStream(__dirname+'/Customers.csv').pipe(parser);
});

const getData = async () => {
  let noAddress = [],
      noEmail = [];
  const [salesByCustomers, customers] = await Promise.all([getSalesByCustomer(), getCustomers()]);
  for (let entry of salesByCustomers) {
    const customer = customers[entry.name];

    if (customer["Billing Address"]) entry["Billing Address"] = customer["Billing Address"];
    else if (customer["Shipping Address"]) entry["Shipping Address"] = customer["Shipping Address"];
    else noAddress.push(entry.name);

    
    if (customer["Email"]) entry["Email"] = customer["Email"];
    else noEmail.push(entry.name);
  }
  
  return salesByCustomers;
}

module.exports = getData;