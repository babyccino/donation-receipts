const PDFDocument = require('pdfkit');
const fs = require('fs');

const createDonationReceipt = (filename, receiptNumber, donee, doner, locationIssued, dateIssued = new Date()) => {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  });

  doc.pipe(fs.createWriteStream(filename));

  const largeFontSize = 15;
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(largeFontSize)
    .text('Official donation receipt for income tax purposes', 15, 20);

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
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text(donee.name, 80, 60);
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text(donee.address);
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text(`Charitable registration #: ${donee.charityNumber}`);

  // date and location issued right side
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text(`Receipt issued: ${dateIssued.getDate()}/${dateIssued.getMonth()}/${dateIssued.getFullYear()}`, 380, 60);
  doc.moveDown();
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text(`Location Issued: ${locationIssued}`);

  // donated by, address
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text(`Donated by: ${doner.name}`, 15, 130);
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text(`Address: ${doner.address}`, 306, 130);

  doc.end();
}

const filename = 'output.pdf',
      receiptNumber = 1,
      donee = {
  name: 'Squamish United Church',
  address: 'Box 286',
  charityNumber: '000000000 RR 0000'
},
      doner = {
  name: 'Jeff Jefferson',
  donerAddress: 'McNamee Pl'
},
locationIssued = 'Squamish, BC';

createDonationReceipt(filename, receiptNumber, donee, doner, locationIssued);
