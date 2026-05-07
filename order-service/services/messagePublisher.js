const amqp = require("amqplib");

const queueName = process.env.RABBITMQ_QUEUE || "order_notifications";
const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost";

const publishOrderCreated = async (data) => {
  let connection;

  try {
    connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    await channel.assertQueue(queueName, { durable: true });

    const message = {
      event: "ORDER_CREATED",
      data,
      timestamp: new Date().toISOString()
    };

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });

    await channel.close();
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

module.exports = {
  publishOrderCreated
};
