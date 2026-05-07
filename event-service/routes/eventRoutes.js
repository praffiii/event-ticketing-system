const express = require("express");
const {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  listTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType
} = require("../controllers/eventController");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();
const adminOnly = [verifyToken, authorizeRole("admin")];

router.get("/events", listEvents);
router.get("/events/:id", getEventById);
router.post("/events", adminOnly, createEvent);
router.put("/events/:id", adminOnly, updateEvent);
router.delete("/events/:id", adminOnly, deleteEvent);

router.get("/events/:id/ticket-types", listTicketTypes);
router.post("/events/:id/ticket-types", adminOnly, createTicketType);
router.put("/ticket-types/:id", adminOnly, updateTicketType);
router.delete("/ticket-types/:id", adminOnly, deleteTicketType);

module.exports = router;
