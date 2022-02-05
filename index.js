const http = require('http'),
      url = require('url'),
      fs = require('fs');
      
const { google } = require('googleapis'),
      destroyer = require('server-destroy'),
      opn = require('open');

const createDonationReceipt = require('./createReceipt'),
      getData = require('./getData'),
      makeBody = require('./mail');


const clientAuth = require("./config/auth.json");

const oauth2Client = new google.auth.OAuth2(
  clientAuth.clientId,
  clientAuth.clientSecret,
  "http://localhost:3000/oauth2callback"
);

const authenticate = async scopes => {
  return new Promise((resolve, reject) => {
    // grab the url that will be used for authorization
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
    });
    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url.indexOf('/oauth2callback') > -1) {
            const qs = new url.URL(req.url, 'http://localhost:3000')
              .searchParams;
            res.end('Authentication successful! Please return to the console.');
            server.destroy();
            const {tokens} = await oauth2Client.getToken(qs.get('code'));
            oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
            resolve(oauth2Client);
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(3000, () => {
        console.log('server running on 3000');
        // open the browser to the authorize url to start the workflow
        opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
      });
    destroyer(server);
  });
};

// main
(async () => {

  // const donor = {
  //   name: 'Jeff Jeffersonison',
  //   billingAddress: 'McNamee Pl',
  //   gift: {
  //     total: 1000,
  //     byCategory: [
  //       {name: "M&S", total: 100},
  //       {name: "local", total: 900}
  //     ]
  //   }
  // };

  const createDrafts = true;
  let auth;

  if (createDrafts) {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose'
    ];

    auth = authenticate(scopes);
  }

  const data = await getData();
  // formatting names
  for (let donor of data) {
    donor.name = donor.name.replace(/[0-9]/g, '').trim();
    if (donor.name.indexOf(',') != -1) {
      donor.name = donor.name.split(', ').reverse().join(' ');
    }
  }

  let gmail;
  if (createDrafts) gmail = google.gmail({version: 'v1', auth: await auth});

  let noAddress = [], noEmail = [];
  
  const donee = {
    name: 'Squamish United Church',
    address: 'Box 286',
    charityNumber: '000000000 RR 0000',
    locationIssued: 'Squamish, BC',
    signer: 'Gus Ryan',
    issuedForYear: 2021
  };
  const limit = 3;
  for (let i = 0; i < Math.min(limit, data.length); ++i) {
    const donor = data[i];
    // if (donor.name != "Cindy Roy") continue;

    const doc = createDonationReceipt(i, donee, donor);

    const filename = `${donor.name.replace(' ', '_')}.pdf`;

    if (true) {
      fs.writeFileSync('./Receipts/' + filename, await doc);
    }

    if (!donor.billAddress) noAddress.push(donor.name);
    if (!donor.email) noEmail.push(donor.name);

    if (createDrafts && donor.email) {
const body = `Dear ${donor.name},

Thank you for contributing to Squamish United Church in 2021. Please see attached your donation receipt

Kind Regards
Gus Ryan
Administrator
Squamish United Church`

      try {
        gmail.users.drafts.create({
          'userId': 'me',
          'resource': {
              'message': {
                  'raw': makeBody("Your 2021 Squamish United Church donation receipt", body, donor.email, {stream: await doc, filename})
              }
          }
        });
      } catch(e) { 
        console.log(e);
      }
    }
  }


  const donor = data[2];

  if (true) {
    const makeDraft = (donor, doc) => {
      
    }
  }

})();
