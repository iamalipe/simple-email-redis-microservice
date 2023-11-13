const Redis = require("ioredis");
const redis = new Redis();

async function addToQueue(emailData) {
  await redis.lpush("email_queue", JSON.stringify(emailData));
}

module.exports = { addToQueue };
