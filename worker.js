const transporter = require("./mailer");
const Redis = require("ioredis");
const redis = new Redis();

async function processQueue() {
  while (true) {
    const emailData = await redis.brpop("email_queue", 0);
    const parsedData = JSON.parse(emailData[1]);

    try {
      // await transporter.sendMail(parsedData);
      console.log("Email sent successfully:", parsedData);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }
}

processQueue();
