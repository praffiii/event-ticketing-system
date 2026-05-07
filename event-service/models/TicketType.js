const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Event = require("./Event");

const TicketType = sequelize.define(
  "TicketType",
  {
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Event,
        key: "id"
      }
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

Event.hasMany(TicketType, {
  foreignKey: "eventId",
  as: "ticketTypes",
  onDelete: "CASCADE"
});

TicketType.belongsTo(Event, {
  foreignKey: "eventId",
  as: "event"
});

module.exports = TicketType;
