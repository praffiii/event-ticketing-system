require("dotenv").config();

const express = require("express");

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Event Service is running",
    data: {
      service: "event-service"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Event Service health check passed",
    data: {
      status: "ok"
    }
  });
});

app.listen(port, () => {
  console.log(`Event Service running on port ${port}`);
});
