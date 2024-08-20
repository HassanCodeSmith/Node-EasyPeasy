require("dotenv").config();

const sgMail = require("@sendgrid/mail");
exports.sendEmail = async (options) => {
  const { email, subject, html } = options;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const message = {
    to: email,
    from: process.env.FROM_EMAIL, // Use the email address or domain you verified above
    subject: subject,
    html: html,
  };
  sgMail.send(message).then(
    () => {
      console.log("email sent");
    },
    (error) => {
      console.error(error);

      if (error.response) {
        console.error(error.response.body);
      }
    }
  );
};
