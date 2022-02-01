const { Buffer } = require('buffer'),
      fs = require('fs');

module.exports = (subject, message, receiverId, attachment) => {
  const boundary = "__myapp__";
  const nl = "\n";
  const attach = attachment.stream ? 
    attachment.stream.toString("base64") :
    '';
  // console.dir(attach);
  const str = [

      "MIME-Version: 1.0",
      "Content-Transfer-Encoding: 7bit",
      "to: " + receiverId,
      "subject: " + subject,
      "Content-Type: multipart/alternate; boundary=" + boundary + nl,
      "--" + boundary,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit" + nl,
      message + nl,
      "--" + boundary,
      "--" + boundary,
      "Content-Type: Application/pdf; name=" + attachment.filename,
      'Content-Disposition: attachment; filename=' + attachment.filename,
      "Content-Transfer-Encoding: base64" + nl,
      attach,
      "--" + boundary + "--"

  ].join("\n");

  return new Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
}