const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({
  size: 'LETTER',
  margins: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
});

doc.pipe(fs.createWriteStream('output.pdf'));

const largeFontSize = 15;
doc
  .font('./fonts/NotoSans-Regular.ttf')
  .fontSize(largeFontSize)
  .text('Official donation receipt for income tax purposes', 15, 20);

let receiptNumber = 1;

doc
  .font('./fonts/NotoSans-Regular.ttf')
  .fontSize(largeFontSize)
  .text(`receipt# ${receiptNumber}`, 470, 20);

// logo
doc.image('./image.jpg', 15, 55, {
  fit: [60, 60]
});

// donee name, address and charity number, left side next to logo
const smallFontSize = 10;
let doneeName = 'Squamish United Church',
    doneeAddress = 'Box 286',
    charityNumber = '000000000 RR 0000';
doc
  .font('./fonts/NotoSans-Regular.ttf')
  .fontSize(smallFontSize)
  .text(doneeName, 80, 60);
doc
  .font('./fonts/NotoSans-Regular.ttf')
  .fontSize(smallFontSize)
  .text(doneeAddress);
doc
  .font('./fonts/NotoSans-Regular.ttf')
  .fontSize(smallFontSize)
  .text(`Charitable registration #: ${charityNumber}`);

// date and location issued right side
let dateIssued = '1/2/2022',
    locationIssued = 'Squamish, BC';
doc
  .font('./fonts/NotoSans-Regular.ttf')
  .fontSize(smallFontSize)
  .text(`Receipt issued: ${dateIssued}`, 380, 60);
doc.moveDown();
doc
  .font('./fonts/NotoSans-Regular.ttf')
  .fontSize(smallFontSize)
  .text(`Location Issued: ${locationIssued}`);

// donated by, address
let donerName = 'Jeff Jefferson',
    donerAddress = 'McNamee Pl';
doc
  .font('./fonts/NotoSans-Regular.ttf')
  .fontSize(smallFontSize)
  .text(`Donated by: ${donerName}`, 15, 130);
doc
  .font('./fonts/NotoSans-Regular.ttf')
  .fontSize(smallFontSize)
  .text(`Address: ${donerAddress}`, , 130);

doc.end();