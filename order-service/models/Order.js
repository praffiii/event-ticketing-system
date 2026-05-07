const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const TicketType = require("./TicketType");

const Order = sequelize.define(
  "Order",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ticketTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
      allowNull: false,
      defaultValue: "pending"
    }
  },
  {
    tableName: "orders"
  }
);

Order.belongsTo(TicketType, {
  foreignKey: "ticketTypeId",
  as: "ticketType"
});

TicketType.hasMany(Order, {
  foreignKey: "ticketTypeId",
  as: "orders"
});

module.exports = Order;
