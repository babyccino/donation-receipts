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
    .text(`Year donations received: ${donee.issuedForYear}`);
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

  if (donor.billingAddress)
    doc
      .font('./fonts/NotoSans-Regular.ttf')
      .fontSize(largeFontSize)
      .text(`Address: ${donor.billingAddress.replace(donor.name, "").trim().replace(/\r\n/g, ", ").replace(/\n|\r/g, ", ")}`, margins.left, doc.y + 5);
  else 
    doc.moveDown();
  
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
  {
    const byCategorySectionWidth = 200,
          spaceBetweenColumns = 8,
          xOffset = 30;
    
    y = doc.y;
    doc
      .font('./fonts/NotoSans-Bold.ttf')
      .fontSize(smallFontSize)
      .text("Category", xOffset + margins.left, y, {
        width: (byCategorySectionWidth - spaceBetweenColumns)/2,
        align: "right"
      })
      .text("Amount", xOffset + margins.left + (byCategorySectionWidth + spaceBetweenColumns)/2, y  );

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
        .text(formatter.format(donation), xOffset + margins.left + (byCategorySectionWidth + spaceBetweenColumns)/2, y  );
    }
  }

  doc.end();
  return getStream.buffer(doc);
}

module.exports = createDonationReceipt;
