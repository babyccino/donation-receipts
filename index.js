const http = require('http');
const url = require('url');
const fs = require('fs');
const commandLineArgs = require('command-line-args');
const readLine = require('readline');
      
const { google } = require('googleapis');
const destroyer = require('server-destroy');
const opn = require('open');

const createDonationReceipt = require('./src/createReceipt');
const getData = require('./src/getData');
const Mail = require('./src/mail');
const readToJSON = require('./src/readToJSON');

const authenticate = scopes => (new Promise((resolve, reject) => {
  // grab the url that will be used for authorization
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes.join(' '),
  });

  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.indexOf('/oauth2callback') > -1) {
        const qs = new url.URL(req.url, 'http://localhost:3000')
          .searchParams;
        res.end('Authentication successful! Please return to the console.');
        server.destroy();
        const { tokens } = await oauth2Client.getToken(qs.get('code'));
        oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
        resolve(oauth2Client);
      }
    } catch (e) {
      reject(e);
    }
  }).listen(3000, () => {
    console.log('server running on 3000');
    // open the browser to the authorize url to start the workflow
    opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
  });

  destroyer(server);
}));

// main
const main = async () => {
  const optionDefinitions = [
    { name: 'drafts', alias: 'd', type: Boolean, defaultOption: false },
    { name: 'write', alias: 'w', type: Boolean, defaultOption: false },
    { name: 'send', alias: 's', type: Boolean, defaultOption: false },
    { name: 'test', alias: 't', type: Boolean, defaultOption: false },
    { name: 'limit', alias: 'l', type: Number, defaultOption: Infinity },
  ];
  const options = commandLineArgs(optionDefinitions);
  
  if (!options.limit) options.limit = Infinity;

  const { 
    drafts: createDrafts,
    write: writeFile,
    send: directSend,
    test: testingPDF,
    limit
  } = options;

  let gmail;
  if (createDrafts) {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose'
    ];

    
    gmail = new Promise(res => {
      authenticate(scopes)
        .then(auth => 
          res(google.gmail({ version: 'v1', auth }))
        );
    });
  }
  
  const { categories } = await readToJSON('./config/categories.json');
  const data = await getData(categories);

  const donee = await readToJSON('./config/donee.json');

  let names;
  if (fs.existsSync('./config/not-sent.json')) {
    fs.readFileSync('./config/not-sent.json', (err, data) => {
      if (err) return;
      try {
        names = new Set(JSON.parse(data).combined);
        console.log(`Donation receipts will only be sent to ${names.length} donors from \
          the last time you run this program who did not have emails and/or billing addresses`)
      }
    });
  }
  
  for (let i = 0; i < data.length; ++i) {
    let donor = data[i];

    donor.name = donor.name.replace(/[0-9]/g, '').trim();
    if (donor.name.indexOf(',') != -1) {
      donor.name = donor.name.split(', ').reverse().join(' ');
    }

    if (names && names.has(donor.name)) {
      data.splice(i, 1);
      --i;
    }
  }
  
  if (directSend) {
    const answer = new Promise(res => {
      const readLineInterface = readLine.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      readLineInterface.question('Donation receipts will be sent directly to donors. \
      If you accept the consequences type "YES" and then enter if you wish to proceed:\n', res);
    });
    
    if ((await answer).trim() !== "YES") process.exit(1);
  }
  
  let noEmails = [];
  let noBillingAddresses = [];
  let combined = [];
  
  for (let i = 0; i < Math.min(limit, data.length); ++i) {
    const donor = data[i];
    if (donor.gift.total <= 0) continue;
    
    if ((!donor.email || !donor.billingAddress) && !testingPDF && !writeFile) {
      combined.push(donor.name);
      if (!donor.email) {
        noEmails.push(donor.name);
        continue;
      }
      if (!donor.billingAddress) {
        noBillingAddresses.push(donor.name);
      }
    }

    const doc = createDonationReceipt(i, donee, donor);

    const filename = donor.name + ".pdf";

    if (testingPDF) {
      fs.writeFile('./output.pdf', await doc);
      return;
    }

    if (writeFile) {
      fs.writeFile('./Receipts/' + filename, await doc);
    }

    if ((createDrafts || directSend) && donor.email) {
      const body =
`Dear ${donor.name},

Thank you for contributing to ${donee.name} in 2021. Please see attached your donation receipt

Kind Regards
${donee.signer}
${donee.name}`;
      const subject = `Your 2021 ${donee.name} donation receipt`

      try {
        if (createDrafts) {
          (await gmail).users.drafts.create({
            'userId': 'me',
            'resource': {
              'message': {
                raw: (await Mail.makeEmail(subject, body, "gus.ryan163@gmail.com", { stream: await doc, filename })).toString("base64")
              }
            }
          });
        }
        
        if (directSend) {
          const emailOptions = await readToJSON('.//config/email.json');
          Mail.sendMail(subject, body, "gus.ryan163@gmail.com", { stream: await doc, filename }, emailOptions)
            .then(console.log.bind(console))
            .catch(console.error.bind(console));
        }
      } catch(e) {
        console.error(e);
      }
    }
  }

  const writeData = JSON.stringify({ billingAddress, noEmails, combined });
  fs.writeFile('./config/not-sent.json', writeData, err => {
    if (err) throw err;

    const text =
`${combine.length} users were not processed as they were either missing emails or billing addresses.
To see who these users are see config/not-sent.json.
Once these users' data has been fixed run the program again to send only to these users`;

    console.log(text);
  });
};

try {
  main();
} catch(e) {
  console.error(e);
  process.exit(1);
}
