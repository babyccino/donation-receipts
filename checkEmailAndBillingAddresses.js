const readToJSON = require('./src/readToJSON');

const noEmailOrBillingAddress = async () => {
  const { categories } = await readToJSON('./config/categories.json');
  const data = await getData(categories);
  
  let noEmails = [];
  let noBillingAddresses = [];
  let combined = [];
  
  // formatting names
  for (let donor of data) {
    donor.name = donor.name.replace(/[0-9]/g, '').trim();
    if (donor.name.indexOf(',') != -1) {
      donor.name = donor.name.split(', ').reverse().join(' ');
    }

    if (donor.gift.total <= 0) continue;
    if (!donor.email) noEmails.push(donor.name);
    if (!donor.billingAddress) noBillingAddresses.push(donor.name);
    if (!donor.email || !donor.billingAddress) combined.push(donor.name);
  }

  console.log("No emails:");
  console.log(noEmails);
  console.log("No billing addresses:");
  console.log(noBillingAddresses);
  console.log("combined:");
  console.log(combined);
};

module.exports = noEmailOrBillingAddress;
