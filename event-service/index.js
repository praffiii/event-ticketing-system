require("dotenv").config();

const express = require("express");
const sequelize = require("./config/database");
require("./models/TicketType");
const eventRoutes = require("./routes/eventRoutes");

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

app.use(eventRoutes);

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
      console.log(`Event Service running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start Event Service:", error.message);
    process.exit(1);
  }
};

startServer();
