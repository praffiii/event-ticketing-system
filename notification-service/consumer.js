require("dotenv").config();

const amqp = require("amqplib");

const queueName = process.env.RABBITMQ_QUEUE || "order_notifications";
const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost";

const logOrderCreatedNotification = (message) => {
  if (!message || message.event !== "ORDER_CREATED" || !message.data) {
    throw new Error("Unsupported message event");
  }

  const {
    orderId,
    userName,
    userEmail,
    eventTitle,
    ticketType,
    quantity,
    totalPrice
  } = message.data;

  console.log(
    `Notification: User ${userName} (${userEmail}) ordered ${quantity} ${ticketType} ticket(s) for ${eventTitle}. Order #${orderId}, Total: ${totalPrice}`
  );
};

const startConsumer = async () => {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    connection.on("error", (error) => {
      console.error("RabbitMQ connection error:", error.message);
    });

    connection.on("close", () => {
      console.error("RabbitMQ connection closed");
    });

    await channel.assertQueue(queueName, { durable: true });

    console.log("Notification Service is ready");
    console.log(`Waiting for messages from queue: ${queueName}`);

    channel.consume(queueName, (msg) => {
      if (!msg) {
        return;
      }

      try {
        const message = JSON.parse(msg.content.toString());

        logOrderCreatedNotification(message);
        channel.ack(msg);
      } catch (error) {
        console.error("Failed to process notification message:", error.message);
        // Requeue the message so it can be retried after a transient failure.
        channel.nack(msg, false, true);
      }
    });

    process.once("SIGINT", async () => {
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start Notification Service:", error.message);
    process.exit(1);
  }
};

startConsumer();
