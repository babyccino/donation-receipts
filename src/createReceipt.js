const PDFDocument = require('pdfkit'),
      getStream = require('get-stream'),
      fs = require('fs');

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

  const largeLogoExists = fs.existsSync('./config/large-logo.png');
  const smallLogoExists = fs.existsSync('./config/small-logo.png');

  const largeFontSize = 15;
  doc
    .font('./fonts/NotoSans-Bold.ttf')
    .fontSize(largeFontSize)
    .text('Official donation receipt for income tax purposes', margins.left, margins.top, {continued: true});

  doc
    .font('./fonts/NotoSans-Bold.ttf')
    .fontSize(largeFontSize)
    .text(`Receipt# ${receiptNumber}`, {
      align: 'right'
    });

  // logo
  const logoSize = 60;
  if (smallLogoExists) {
    doc.image('./config/small-logo.png', margins.left, 55, {
      fit: [logoSize, logoSize]
    });
  }

  // donee name, address and charity number, left side next to logo
  const smallFontSize = 10;
  doc
    .font('./fonts/NotoSans-Bold.ttf')
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
    .font('./fonts/NotoSans-Bold.ttf')
    .fontSize(smallFontSize)
    .text(`Receipt issued: `, 380, 60, {continued: true})
    .font('./fonts/NotoSans-Regular.ttf')
    .text(`${dateIssued.getDate()}/${dateIssued.getMonth()+1}/${dateIssued.getFullYear()}`);
  doc
    .font('./fonts/NotoSans-Bold.ttf')
    .fontSize(smallFontSize)
    .text(`Year donations received: `, {continued: true})
    .font('./fonts/NotoSans-Regular.ttf')
    .text(donee.issuedForYear);
  doc
    .font('./fonts/NotoSans-Bold.ttf')
    .fontSize(smallFontSize)
    .text(`Location Issued: `, {continued: true})
    .font('./fonts/NotoSans-Regular.ttf')
    .text(donee.locationIssued);

  // donated by, address
  doc
    .font('./fonts/NotoSans-Bold.ttf')
    .fontSize(largeFontSize)
    .text(`Donated by: `, margins.left, 130, {continued: true})
    .font('./fonts/NotoSans-Regular.ttf')
    .text(donor.name);
  doc
    .moveTo(88 + margins.left, doc.y)
    .lineTo(doc.page.width - margins.right, doc.y)
    .stroke();

  let billAddressText;
  if (donor.billingAddress) {
    billAddressText = donor.billingAddress.replace(donor.name, "").trim().replace(/\r\n/g, ", ").replace(/\n|\r/g, ", ");
  } else
    billAddressText = " ";
  doc
    .font('./fonts/NotoSans-Bold.ttf')
    .fontSize(largeFontSize)
    .text(`Address: `, margins.left, doc.y + 5, {continued: true})
    .font('./fonts/NotoSans-Regular.ttf')
    .text(billAddressText);
  
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
    .text(`Eligible amount of gift for tax purposes:`)
    .fontSize(40)
    .text(formatter.format(donor.gift.total));
  
  signature = {x: 380, y, width: 200, height:50}
  doc.image('./config/signature.png', signature.x, signature.y, {
    fit: [signature.width, signature.height]
  });
  y += signature.height;
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
    .text(' ', margins.left, doc.y, {align: "center"})
    .text('Canada Revenue Agency: www.canada.ca/charities-giving', margins.left, doc.y, {align: "center"});

  doc.moveDown();
  doc
    .moveTo(doc.x, doc.y)
    .lineTo(doc.page.width - margins.right, doc.y)
    .stroke();

  doc.moveDown();
  doc
    .font('./fonts/NotoSans-Regular.ttf')
    .fontSize(smallFontSize)
    .text('For your own records', {align: "center"});

  doc.moveDown();
  y = doc.y;
  if (largeLogoExists) {
    doc.image('./config/large-logo.png', margins.left, y, {
      fit: [200, 100]
    });
  } else if (smallLogoExists) {
    doc.image('./config/small-logo.png', margins.left, 55, {
      fit: [logoSize, logoSize]
    });
  }

  doc.moveDown();
  doc.font('./fonts/NotoSans-Bold.ttf')
    .fontSize(smallFontSize)
    .text(donee.name);
  doc.moveDown();

  y = doc.y;
  if (donor.billingAddress) {
    if (donor.billingAddress.indexOf(donor.name) === -1) {
      doc
        .font('./fonts/NotoSans-regular.ttf')
        .fontSize(smallFontSize)
        .text(donor.name);
    }
    doc
      .font('./fonts/NotoSans-regular.ttf')
      .fontSize(smallFontSize)
      .text(donor.billingAddress);
  } else {
    doc
      .font('./fonts/NotoSans-regular.ttf')
      .fontSize(smallFontSize)
      .text(donor.name);
  }

  doc
    .font('./fonts/NotoSans-Bold.ttf')
    .fontSize(smallFontSize)
    .text(`Receipt No: `, 380, y, {continued: true})
    .font('./fonts/NotoSans-Regular.ttf')
    .text(receiptNumber);
  doc
    .font('./fonts/NotoSans-Bold.ttf')
    .fontSize(smallFontSize)
    .text(`Receipt issued: `, {continued: true})
    .font('./fonts/NotoSans-Regular.ttf')
    .text(`${dateIssued.getDate()}/${dateIssued.getMonth()}/${dateIssued.getFullYear()}`);
  doc
    .font('./fonts/NotoSans-Bold.ttf')
    .fontSize(smallFontSize)
    .text(`Year donations received: `, {continued: true})
    .font('./fonts/NotoSans-Regular.ttf')
    .text(donee.issuedForYear);
  doc
    .font('./fonts/NotoSans-Bold.ttf')
    .fontSize(smallFontSize)
    .text(`Total: `, {continued: true})
    .font('./fonts/NotoSans-Regular.ttf')
    .text(formatter.format(donor.gift.total));

  doc.moveDown().moveDown();  
  {
    const byCategorySectionWidth = 350,
          spaceBetweenColumns = 8,
          xOffset = 100;
    
    y = doc.y;
    doc
      .font('./fonts/NotoSans-Bold.ttf')
      .fontSize(smallFontSize)
      .text("Category", xOffset + margins.left, y, {
        width: (byCategorySectionWidth - spaceBetweenColumns)/2,
        align: "right"
      })
      .text("Amount", xOffset + margins.left + (byCategorySectionWidth + spaceBetweenColumns)/2, y);

    doc
      .moveTo(xOffset + margins.left, doc.y + 1)
      .lineTo(xOffset + margins.left + (byCategorySectionWidth - spaceBetweenColumns)/2, doc.y + 1)
      .stroke();
    doc
      .moveTo(xOffset + margins.left + (byCategorySectionWidth + spaceBetweenColumns)/2, doc.y + 1)
      .lineTo(xOffset + margins.left + byCategorySectionWidth, doc.y + 1)
      .stroke();

    doc.y += 2
    
    for (const category in donor.gift.byCategory) {
      const donation = donor.gift.byCategory[category];
      y = doc.y;
      doc
        .font('./fonts/NotoSans-Regular.ttf')
        .fontSize(smallFontSize)
        .text(category, xOffset + margins.left, y, {
          width: (byCategorySectionWidth - spaceBetweenColumns)/2,
          align: "right"
        })
        .text(formatter.format(donation), xOffset + margins.left + (byCategorySectionWidth + spaceBetweenColumns)/2, y);
    }
  }

  doc.end();
  return getStream.buffer(doc);
}

module.exports = createDonationReceipt;
