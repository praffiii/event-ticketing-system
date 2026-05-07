require("dotenv").config();

const express = require("express");
const sequelize = require("./config/database");
require("./models/User");
const authRoutes = require("./routes/authRoutes");

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Auth Service is running",
    data: {
      service: "auth-service"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Auth Service health check passed",
    data: {
      status: "ok"
    }
  });
});

app.use("/auth", authRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    app.listen(port, () => {
      console.log(`Auth Service running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start Auth Service:", error.message);
    process.exit(1);
  }
};

startServer();
