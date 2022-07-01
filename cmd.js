const hey = [{}, {}, {}];
for (let i of hey) {
  delete i;
}
console.log(hey);

// const fs = require('fs');

// const main = async () => {
//   fs.readFile('./config/asdf.json', (err, data) => {
//     console.log(err, data);
//     try {
//       console.log(JSON.parse(data));
//     } catch(e) {
//       console.error(e);
//     }
//     console.log("hey");
//   });
// };
// main();