const http = require('http'),
      url = require('url');
      
const { google } = require('googleapis'),
      destroyer = require('server-destroy'),
      opn = require('open');

const createDonationReceipt = require('./createReceipt'),
      getData = require('./getData');

getData();

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

const listLabels = auth => {
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {
      console.log('Labels:');
      labels.forEach((label) => {
        console.log(`- ${label.name}`);
      });
    } else {
      console.log('No labels found.');
    }
  });
};

const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose'
];
// authenticate(scopes)
//   .then(listLabels)
//   .catch(console.error);

const filename = 'output.pdf',
      receiptNumber = 1,
      donee = {
        name: 'Squamish United Church',
        address: 'Box 286',
        charityNumber: '000000000 RR 0000',
        locationIssued: 'Squamish, BC',
        signer: 'Gus Ryan'
      },
      donor = {
        name: 'Jeff Jeffersonison',
        address: 'McNamee Pl',
        gift: {
          total: 1000,
          byCategory: [
            {name: "M&S", total: 100},
            {name: "local", total: 900}
          ]
        }
      };

// createDonationReceipt(filename, receiptNumber, donee, donor);
