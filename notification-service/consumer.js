require("dotenv").config();

const queueName = process.env.RABBITMQ_QUEUE || "order_notifications";

console.log("Notification Service is ready");
console.log(`Waiting for messages from queue: ${queueName}`);
