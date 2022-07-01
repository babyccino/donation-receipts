const fs = require('fs');

const readToJSON = fileName => new Promise((res, rej) => {
  fs.readFile(fileName, "utf8", (err, data) => {
    try {
      if (err) rej(err);
      res(JSON.parse(data));
    } catch (e) {
      console.log(e);
    }
  })
});

module.exports = readToJSON;
