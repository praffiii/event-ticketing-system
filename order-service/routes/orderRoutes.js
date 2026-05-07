const express = require("express");
const {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus
} = require("../controllers/orderController");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/orders", verifyToken, createOrder);
router.get("/orders", verifyToken, listOrders);
router.get("/orders/:id", verifyToken, getOrderById);
router.put("/orders/:id/status", verifyToken, authorizeRole("admin"), updateOrderStatus);

module.exports = router;
