const nodemailer = require("nodemailer");

async function sendResults(data) {
  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  await transporter.verify();
  const html = `<div>
	<ul>
	${data.map(
    el => `<li>
	<h4>${el.title}</h4>
	<a href=${el.url}>Voir plus</a>
	</li>`
  )}
	</ul>
	</div>`;

  await transporter.sendMail({
    to: "anaismoutarlier@gmail.com",
    from: {
      name: "Anais Moutarlier",
      address: process.env.SMTP_EMAIL,
    },
    html,
    subject: "Nouveau posts WTTJ",
  });
}

module.exports = sendResults;
