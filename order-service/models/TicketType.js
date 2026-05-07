const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Event = require("./Event");

const TicketType = sequelize.define(
  "TicketType",
  {
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    quota: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "ticket_types"
  }
);

TicketType.belongsTo(Event, {
  foreignKey: "eventId",
  as: "event"
});

Event.hasMany(TicketType, {
  foreignKey: "eventId",
  as: "ticketTypes"
});

module.exports = TicketType;
