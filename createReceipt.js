const PDFDocument = require('pdfkit'),
      getStream = require('get-stream');

const createDonationReceipt = (receiptNumber, donee, donor, dateIssued = new Date()) => {
  const margins = {
          top: 25,
          bottom: 25,
          left: 25,
          right: 25
        },
        doc = new PDFDocument({
          size: 'LETTER',
          margins
        });

  const largeFontSize = 15;
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(largeFontSize)
    .text('Official donation receipt for income tax purposes', margins.left, margins.top, {continued: true});

  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(largeFontSize)
    .text(`Receipt# ${receiptNumber}`, {
      align: 'right'
    });

  // logo
  const logoSize = 60;
  doc.image('./image.jpg', margins.left, 55, {
    fit: [logoSize, logoSize]
  });

  // donee name, address and charity number, left side next to logo
  const smallFontSize = 10;
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text(donee.name, logoSize + margins.left + 3, 60);
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
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text(`Year donations received: 2021`);
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text(`Location Issued: ${donee.locationIssued}`);

  // donated by, address
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(largeFontSize)
    .text(`Donated by: ${donor.name}`, margins.left, 130);
  doc
    .moveTo(87 + margins.left, doc.y)
    .lineTo(doc.page.width - margins.right, doc.y)
    .stroke();
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(largeFontSize)
    .text(`Address: ${donor.address}`, margins.left, doc.y + 5);
  doc
    .moveTo(64 + margins.left, doc.y)
    .lineTo(doc.page.width - margins.right, doc.y)
    .stroke();
  
  var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  doc.moveDown();
  let y = doc.y;
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text(`Eligible amount of gift for tax purposes:  `)
    .fontSize(40)
    .text(formatter.format(donor.gift.total));
  
  signature = {x: 380, y, width: 200, height:50}
  doc.image('./signature.png', signature.x, signature.y, {
    fit: [signature.width, signature.height]
  });
  y += signature.height
  doc
    .moveTo(signature.x, y)
    .lineTo(signature.x + signature.width, y)
    .stroke();
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text(donee.signer, signature.x, y + 3)

  doc.moveDown();
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text('Canada Revenue Agency: www.canada.ca/charities-giving', margins.left, doc.y, {align: "center"});

  doc.moveDown();
  doc
    .moveTo(doc.x, doc.y)
    .lineTo(doc.page.width - margins.right, doc.y)
    .stroke();

  doc.moveDown();
  const byCategorySectionWidth = 300,
        spaceBetweenColumns = 1;
  

  // text interaction is broken with right-aligned text so below is a bit stupid
  doc
    .font('./fonts/NotoSans-Bold.ttf')
    .fontSize(smallFontSize)
    .text("Category", margins.left, doc.y, {
      align: "right",
      width: (byCategorySectionWidth - spaceBetweenColumns)/2,
      continued: true,
      lineBreak: false
    })
    .text("Amount", byCategorySectionWidth/2-8, doc.y, {align: "left", lineBreak: false});

  doc
    .moveTo(margins.left + byCategorySectionWidth/2 - 100, doc.y + 1)
    .lineTo(margins.left + byCategorySectionWidth/2, doc.y)
    .stroke();
  doc
    .moveTo(margins.left + byCategorySectionWidth/2 + 11, doc.y + 1)
    .lineTo(margins.left + byCategorySectionWidth/2 + 11 + 100, doc.y)
    .stroke();

  doc.y += 2
  
  for (const {name, total} of donor.gift.byCategory) {
    doc
      .font('./fonts/NotoSans-Regular.ttf')
      .fontSize(smallFontSize)
      .text(name, margins.left, doc.y, {
        align: "right",
        width: (byCategorySectionWidth - spaceBetweenColumns)/2,
        continued: true
      })
      .text(formatter.format(total), byCategorySectionWidth/2+15, doc.y, {align: "left"});
  }
  //

  doc.end();
  return getStream.buffer(doc);
}

module.exports = createDonationReceipt;
