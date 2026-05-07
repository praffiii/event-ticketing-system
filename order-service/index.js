require("dotenv").config();

const express = require("express");

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Order Service is running",
    data: {
      service: "order-service"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Order Service health check passed",
    data: {
      status: "ok"
    }
  });
});

app.listen(port, () => {
  console.log(`Order Service running on port ${port}`);
});
