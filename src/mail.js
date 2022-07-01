const MailComposer = require("nodemailer/lib/mail-composer");
const NodeMailer = require("nodemailer");

const readToJSON = require('./readToJSON');

const makeSender = (email, name) => `"${name}" ${email}`;

let emailOptions;

const makeMailOptions = (subject, message, to, attachment, from) => ({
  to,
  from,
  subject,
  html: '<html>' + message.replace(/\n/g, '<br />') + '</html>',
  attachments: [
    {
      filename: attachment.filename,
      content: attachment.stream,
      contentType: 'application/pdf'
    },
  ]
});

const sendMail = (subject, message, receiverId, attachment, emailOptions) => {
  const auth = {
    service: emailOptions.service,
    auth: {
      user: emailOptions.user,
      pass: emailOptions.pass
    }
  };
  const from = makeSender(emailOptions.user, emailOptions.name);
  const smtpTransport = NodeMailer.createTransport(auth);
  const mailOptions = makeMailOptions(subject, message, "gus.ryan163@gmail.com", attachment, from);
  return smtpTransport.sendMail(mailOptions);
};

const makeEmail = async (subject, message, receiverId, attachment) => {
  if (!emailOptions) emailOptions = await readToJSON('./config/email.json');
  const from = makeSender(emailOptions.user, emailOptions.name);
  const mailOptions = makeMailOptions(subject, message, receiverId, attachment, from);
  var mail = new MailComposer(mailOptions);
  const email = await mail.compile().build();
  return email;
};

module.exports = {
  sendMail,
  makeEmail
};
