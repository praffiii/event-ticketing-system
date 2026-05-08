require("dotenv").config();

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const logger = require("./middleware/logger");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();
const port = process.env.PORT || 3000;
const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const eventServiceUrl = process.env.EVENT_SERVICE_URL || "http://localhost:3002";
const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://localhost:3003";

app.use(logger);
app.use(rateLimiter);

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

const proxyErrorHandler = (serviceName) => {
  return (err, req, res) => {
    console.error(`${serviceName} proxy error:`, err.message);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: `${serviceName} is unavailable`,
        errors: []
      });
    }
  };
};

const createServiceProxy = (target, serviceName) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl,
    on: {
      error: proxyErrorHandler(serviceName)
    }
  });
};

app.use("/auth", createServiceProxy(authServiceUrl, "Auth Service"));
app.use("/events", createServiceProxy(eventServiceUrl, "Event Service"));
app.use("/ticket-types", createServiceProxy(eventServiceUrl, "Event Service"));
app.use("/orders", createServiceProxy(orderServiceUrl, "Order Service"));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    errors: []
  });
});

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
