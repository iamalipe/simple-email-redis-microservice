const express = require("express");
const promClient = require("prom-client");

const transporter = require("./mailer");
const logger = require("./logger");
const redis = require("./redis");

const app = express();
const port = 3000;

// Prometheus metrics middleware
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ register: promClient.register });

app.use(express.json());

// Custom logging middleware for requests
app.use((req, res, next) => {
  const logInfo = {
    ip: req.ip,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
  };
  // Log the request information
  logger.info("Request:", logInfo);
  // Continue with the request
  next();
});

// Custom logging middleware for responses
app.use((req, res, next) => {
  // Capture the original end function
  const originalEnd = res.end;
  // Override the end function to log the response details
  res.end = function (chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);
    const logInfo = {
      statusCode: res.statusCode,
      headers: res.getHeaders(),
      body: chunk && chunk.toString(),
    };
    // Log the response information
    logger.info("Response:", logInfo);
  };
  // Continue with the response
  next();
});

app.post("/send-email", async (req, res) => {
  const emailData = req.body;

  try {
    // Send the email immediately for simplicity, you may want to queue it.
    // await transporter.sendMail(emailData);
    res.json({ message: "Email sent successfully" });
    logger.info("Email sent successfully:", emailData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
    logger.error("Error sending email:", error);
  }
});

app.post("/queue-email", async (req, res) => {
  const emailData = req.body;
  try {
    for (let index = 0; index < 10000; index++) {
      const newData = { ...emailData, idx: index };
      await redis.addToQueue(newData);
    }
    res.json({ message: "Email added to the queue" });
    logger.info("Email added to the queue:", emailData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
    logger.error("Error adding email to the queue:", error);
  }
});

app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", promClient.register.contentType);
  const metrics = await promClient.register.metrics();
  res.send(metrics);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  logger.info(`Server is running on http://localhost:${port}`);
});
