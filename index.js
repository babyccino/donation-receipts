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

const question = text => new Promise(res => {
  const readLineInterface = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readLineInterface.question(text, res);
});

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
    fs.readFileSync('./config/not-sent.json', (err, notSentData) => {
      if (err) return;
      try {
        const json = JSON.parse(notSentData);
        names = new Set(json.combined);
        console.log(`Donation receipts will only be sent to ${names.length} donors from \
          the last time you run this program who did not have emails and/or billing addresses`)
      } catch (e) {}
    });
  }
  
  for (let i = 0; i < data.length; ++i) {
    let donor = data[i];

    donor.name = donor.name.replace(/[0-9]/g, '').trim();
    if (donor.name.indexOf(',') != -1) {
      donor.name = donor.name.split(', ').reverse().join(' ');
    }
  }
  
  let alreadySent;
  if (directSend) {
    const answer = await question('Donation receipts will be sent directly to donors. \
      If you accept the consequences type "YES" and then enter if you wish to proceed:\n');
    
    
    if ((await answer).trim() !== "YES") process.exit(1);

    try {
      alreadySent = new Set((await readToJSON('./config/already-sent.json')).alreadySent);
    } catch(e) { }
  }
  
  let noEmails = [];
  let noBillingAddresses = [];
  let combined = [];
  
  const len = testingPDF ? 1 : Math.min(limit, data.length);
  for (let i = 0; i < len; ++i) {
    const donor = data[i];
    if (donor.gift.total <= 0) continue;
    if (names && !names.has(donor.name)) continue;
    
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

    const doc = createDonationReceipt(i + 1, donee, donor);

    const filename = donor.name + ".pdf";

    if (testingPDF) {
      return fs.writeFileSync('./output.pdf', await doc);
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
          if (alreadySent && alreadySent.has(donor.email)) {
            const questionText = `A receipt has already been sent to ${donor.name}, would you like to send one to this person again?\nType YES to send: `;
            const answer = await question(questionText);
            
            if (answer !== "YES") continue;
          }

          const emailOptions = await readToJSON('./config/email.json');
          Mail.sendMail(subject, body, "gus.ryan163@gmail.com", { stream: await doc, filename }, emailOptions)
            .then(info => {
              console.log(info);
              alreadySent.add(donor.email);
            })
            .catch(console.error.bind(console));
        }
      } catch(e) {
        console.error(e);
      }
    }
  }
  
  if (combined.length) {
    const writeData = JSON.stringify({ noBillingAddresses, noEmails, combined });
    fs.writeFile('./config/not-sent.json', writeData, err => {
      if (err) throw err;

      const text =
`${combined.length} users were not processed as they were either missing emails or billing addresses.
To see these users, see config/not-sent.json.
Once these users' data has been fixed run the program again to send only to these users`;

      console.log(text);
    });
  }
};

main().catch(e => {
  console.error(e);
  process.exit(1);
});
