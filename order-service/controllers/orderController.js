const sequelize = require("../config/database");
const Event = require("../models/Event");
const TicketType = require("../models/TicketType");
const Order = require("../models/Order");
const { publishOrderCreated } = require("../services/messagePublisher");

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

const isPositiveInteger = (value) => {
  if (value === null || value === "" || typeof value === "boolean") {
    return false;
  }

  return Number.isInteger(Number(value)) && Number(value) > 0;
};

const orderInclude = [
  {
    model: TicketType,
    as: "ticketType",
    include: [{ model: Event, as: "event" }]
  }
];

const createOrder = async (req, res) => {
  if (req.user.role !== "customer") {
    return errorResponse(res, 403, "Only customers can create orders");
  }

  const { ticketTypeId, quantity } = req.body;

  if (!isPositiveInteger(ticketTypeId) || !isPositiveInteger(quantity)) {
    return errorResponse(res, 400, "Ticket type id and quantity must be positive integers");
  }

  let createdOrder;
  let notificationData;

  try {
    await sequelize.transaction(async (transaction) => {
      const ticketType = await TicketType.findByPk(ticketTypeId, {
        include: [{ model: Event, as: "event" }],
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!ticketType) {
        throw Object.assign(new Error("Ticket type not found"), { statusCode: 404 });
      }

      const orderQuantity = Number(quantity);
      const availableQuota = Number(ticketType.quota);

      if (availableQuota < orderQuantity) {
        throw Object.assign(new Error("Insufficient ticket quota"), { statusCode: 400 });
      }

      const totalPrice = Number(ticketType.price) * orderQuantity;

      await ticketType.update(
        { quota: availableQuota - orderQuantity },
        { transaction }
      );

      createdOrder = await Order.create(
        {
          userId: req.user.id,
          userName: req.user.name,
          userEmail: req.user.email,
          ticketTypeId: ticketType.id,
          quantity: orderQuantity,
          totalPrice,
          status: "pending"
        },
        { transaction }
      );

      notificationData = {
        orderId: createdOrder.id,
        userName: req.user.name,
        userEmail: req.user.email,
        eventTitle: ticketType.event.title,
        ticketType: ticketType.name,
        quantity: orderQuantity,
        totalPrice
      };
    });

    try {
      await publishOrderCreated(notificationData);
    } catch (error) {
      console.error("Failed to publish ORDER_CREATED message:", error.message);
    }

    const order = await Order.findByPk(createdOrder.id, {
      include: orderInclude
    });

    return successResponse(res, 201, "Order created successfully", { order });
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.statusCode, error.message);
    }

    return errorResponse(res, 500, "Failed to create order");
  }
};

const listOrders = async (req, res) => {
  try {
    const where = {};

    if (req.user.role === "customer") {
      where.userId = req.user.id;
    } else if (req.user.role !== "admin") {
      return errorResponse(res, 403, "You do not have permission to access this resource");
    }

    const orders = await Order.findAll({
      where,
      include: orderInclude,
      order: [["createdAt", "DESC"]]
    });

    return successResponse(res, 200, "Orders retrieved successfully", { orders });
  } catch (error) {
    return errorResponse(res, 500, "Failed to retrieve orders");
  }
};

const getOrderById = async (req, res) => {
  try {
    const where = { id: req.params.id };

    if (req.user.role === "customer") {
      where.userId = req.user.id;
    } else if (req.user.role !== "admin") {
      return errorResponse(res, 403, "You do not have permission to access this resource");
    }

    const order = await Order.findOne({
      where,
      include: orderInclude
    });

    if (!order) {
      return errorResponse(res, 404, "Order not found");
    }

    return successResponse(res, 200, "Order retrieved successfully", { order });
  } catch (error) {
    return errorResponse(res, 500, "Failed to retrieve order");
  }
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["pending", "confirmed", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    return errorResponse(res, 400, "Status must be pending, confirmed, or cancelled");
  }

  try {
    let updatedOrder;

    await sequelize.transaction(async (transaction) => {
      const order = await Order.findByPk(req.params.id, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!order) {
        throw Object.assign(new Error("Order not found"), { statusCode: 404 });
      }

      const previousStatus = order.status;

      if (status === "cancelled" && previousStatus !== "cancelled") {
        const ticketType = await TicketType.findByPk(order.ticketTypeId, {
          lock: transaction.LOCK.UPDATE,
          transaction
        });

        if (!ticketType) {
          throw Object.assign(new Error("Ticket type not found"), { statusCode: 404 });
        }

        await ticketType.update(
          { quota: Number(ticketType.quota) + Number(order.quantity) },
          { transaction }
        );
      }

      if (status !== "cancelled" && previousStatus === "cancelled") {
        const ticketType = await TicketType.findByPk(order.ticketTypeId, {
          lock: transaction.LOCK.UPDATE,
          transaction
        });

        if (!ticketType) {
          throw Object.assign(new Error("Ticket type not found"), { statusCode: 404 });
        }

        if (Number(ticketType.quota) < Number(order.quantity)) {
          throw Object.assign(new Error("Insufficient ticket quota"), { statusCode: 400 });
        }

        await ticketType.update(
          { quota: Number(ticketType.quota) - Number(order.quantity) },
          { transaction }
        );
      }

      await order.update({ status }, { transaction });
      updatedOrder = order;
    });

    const order = await Order.findByPk(updatedOrder.id, {
      include: orderInclude
    });

    return successResponse(res, 200, "Order status updated successfully", { order });
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.statusCode, error.message);
    }

    return errorResponse(res, 500, "Failed to update order status");
  }
};

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus
};
