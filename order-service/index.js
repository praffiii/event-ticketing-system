require("dotenv").config();

const express = require("express");
const sequelize = require("./config/database");
require("./models/Order");
const orderRoutes = require("./routes/orderRoutes");

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

app.use(orderRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    errors: []
  });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    app.listen(port, () => {
      console.log(`Order Service running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start Order Service:", error.message);
    process.exit(1);
  }
};

startServer();
