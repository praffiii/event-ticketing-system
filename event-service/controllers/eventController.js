const Event = require("../models/Event");
const TicketType = require("../models/TicketType");

const successResponse = (res, status, message, data = {}) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, status, message, errors = []) => {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
};

const isPresentString = (value) => {
  return typeof value === "string" && value.trim() !== "";
};

const isPositiveNumber = (value) => {
  if (value === null || value === "" || typeof value === "boolean") {
    return false;
  }

  return Number.isFinite(Number(value)) && Number(value) > 0;
};

const isNonNegativeInteger = (value) => {
  if (value === null || value === "" || typeof value === "boolean") {
    return false;
  }

  return Number.isInteger(Number(value)) && Number(value) >= 0;
};

const isValidDateInput = (value) => {
  if (value === null || value === "" || typeof value === "boolean") {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
};

const listEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [{ model: TicketType, as: "ticketTypes" }],
      order: [["date", "ASC"]]
    });

    return successResponse(res, 200, "Events retrieved successfully", { events });
  } catch (error) {
    return errorResponse(res, 500, "Failed to retrieve events");
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: TicketType, as: "ticketTypes" }]
    });

    if (!event) {
      return errorResponse(res, 404, "Event not found");
    }

    return successResponse(res, 200, "Event retrieved successfully", { event });
  } catch (error) {
    return errorResponse(res, 500, "Failed to retrieve event");
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, location, date } = req.body;

    if (!isPresentString(title) || !isPresentString(location) || !isValidDateInput(date)) {
      return errorResponse(res, 400, "Title, location, and date are required");
    }

    const eventDate = new Date(date);

    const event = await Event.create({
      title,
      description,
      location,
      date: eventDate,
      createdBy: req.user.id
    });

    return successResponse(res, 201, "Event created successfully", { event });
  } catch (error) {
    return errorResponse(res, 500, "Failed to create event");
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return errorResponse(res, 404, "Event not found");
    }

    const { title, description, location, date } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (!isPresentString(title)) {
        return errorResponse(res, 400, "Title must not be empty");
      }

      updates.title = title;
    }

    if (description !== undefined) updates.description = description;

    if (location !== undefined) {
      if (!isPresentString(location)) {
        return errorResponse(res, 400, "Location must not be empty");
      }

      updates.location = location;
    }

    if (date !== undefined) {
      if (!isValidDateInput(date)) {
        return errorResponse(res, 400, "Date must be a valid date");
      }

      updates.date = new Date(date);
    }

    await event.update(updates);

    return successResponse(res, 200, "Event updated successfully", { event });
  } catch (error) {
    return errorResponse(res, 500, "Failed to update event");
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return errorResponse(res, 404, "Event not found");
    }

    await event.destroy();

    return successResponse(res, 200, "Event deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Failed to delete event");
  }
};

const listTicketTypes = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return errorResponse(res, 404, "Event not found");
    }

    const ticketTypes = await TicketType.findAll({
      where: { eventId: event.id },
      order: [["id", "ASC"]]
    });

    return successResponse(res, 200, "Ticket types retrieved successfully", { ticketTypes });
  } catch (error) {
    return errorResponse(res, 500, "Failed to retrieve ticket types");
  }
};

const createTicketType = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return errorResponse(res, 404, "Event not found");
    }

    const { name, price, quota } = req.body;

    if (!isPresentString(name) || price === undefined || quota === undefined) {
      return errorResponse(res, 400, "Name, price, and quota are required");
    }

    if (!isPositiveNumber(price)) {
      return errorResponse(res, 400, "Price must be greater than 0");
    }

    if (!isNonNegativeInteger(quota)) {
      return errorResponse(res, 400, "Quota must be a non-negative integer");
    }

    const ticketType = await TicketType.create({
      eventId: event.id,
      name,
      price,
      quota
    });

    return successResponse(res, 201, "Ticket type created successfully", { ticketType });
  } catch (error) {
    return errorResponse(res, 500, "Failed to create ticket type");
  }
};

const updateTicketType = async (req, res) => {
  try {
    const ticketType = await TicketType.findByPk(req.params.id);

    if (!ticketType) {
      return errorResponse(res, 404, "Ticket type not found");
    }

    const { name, price, quota } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!isPresentString(name)) {
        return errorResponse(res, 400, "Name must not be empty");
      }

      updates.name = name;
    }

    if (price !== undefined) {
      if (!isPositiveNumber(price)) {
        return errorResponse(res, 400, "Price must be greater than 0");
      }

      updates.price = price;
    }

    if (quota !== undefined) {
      if (!isNonNegativeInteger(quota)) {
        return errorResponse(res, 400, "Quota must be a non-negative integer");
      }

      updates.quota = quota;
    }

    await ticketType.update(updates);

    return successResponse(res, 200, "Ticket type updated successfully", { ticketType });
  } catch (error) {
    return errorResponse(res, 500, "Failed to update ticket type");
  }
};

const deleteTicketType = async (req, res) => {
  try {
    const ticketType = await TicketType.findByPk(req.params.id);

    if (!ticketType) {
      return errorResponse(res, 404, "Ticket type not found");
    }

    await ticketType.destroy();

    return successResponse(res, 200, "Ticket type deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Failed to delete ticket type");
  }
};

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  listTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType
};
