require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();
const port = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(morgan("dev"));
app.use(limiter);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Gateway is running",
    data: {
      service: "api-gateway"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API Gateway health check passed",
    data: {
      status: "ok"
    }
  });
});

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
