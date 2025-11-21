const { Kafka } = require("kafkajs");
const avro = require("avsc");
const fs = require("fs");
const path = require("path");

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",").map((broker) => broker.trim());

const ORDERS_TOPIC = "orders";
const DLQ_TOPIC = "orders-dlq";
const CONSUMER_GROUP_ID = "order-group";
const MAX_RETRY_ATTEMPTS = 3;
const FAILURE_RATE = 0.2;
const SCHEMA_PATH = path.join(__dirname, "order.avsc");

const schema = avro.parse(
  JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"))
);

const kafka = new Kafka({
  clientId: "order-consumer",
  brokers: KAFKA_BROKERS,
});

const consumer = kafka.consumer({ groupId: CONSUMER_GROUP_ID });
const producer = kafka.producer();

const stats = {
  totalPrice: 0,
  processedCount: 0,
  failedCount: 0,
};

async function processOrder(order) {
  if (Math.random() < FAILURE_RATE) {
    throw new Error("Random simulated failure");
  }
}

function getRunningAverage() {
  if (stats.processedCount === 0) return 0;
  return stats.totalPrice / stats.processedCount;
}

async function sendToDLQ(order) {
  try {
    const encodedOrder = schema.toBuffer(order);

    await producer.send({
      topic: DLQ_TOPIC,
      messages: [{ value: encodedOrder }],
    });

    console.log(`⚠ Moved to DLQ: ${order.orderId}`);
    stats.failedCount++;
  } catch (error) {
    console.error(`✗ Failed to send to DLQ: ${error.message}`);
  }
}

async function processOrderWithRetry(order) {
  let attempts = 0;
  let success = false;

  while (attempts < MAX_RETRY_ATTEMPTS && !success) {
    try {
      await processOrder(order);
      success = true;

      stats.totalPrice += order.price;
      stats.processedCount++;

      const avgPrice = getRunningAverage();
      console.log(
        `✓ Order processed: ${order.orderId} | ` +
          `Price: ${order.price.toFixed(2)} | ` +
          `Running Avg: ${avgPrice.toFixed(2)} | ` +
          `Total: ${stats.processedCount}`
      );
    } catch (error) {
      attempts++;
      if (attempts < MAX_RETRY_ATTEMPTS) {
        console.log(
          `↻ Retry attempt ${attempts}/${MAX_RETRY_ATTEMPTS} for order ${order.orderId}`
        );
      }
    }
  }

  if (!success) {
    await sendToDLQ(order);
  }
}

async function startConsumer() {
  try {
    await producer.connect();
    await consumer.connect();
    console.log("Consumer connected to Kafka");

    await consumer.subscribe({
      topic: ORDERS_TOPIC,
      fromBeginning: false,
    });

    console.log(`Subscribed to topic: ${ORDERS_TOPIC}`);

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const order = schema.fromBuffer(message.value);
          await processOrderWithRetry(order);
        } catch (error) {
          console.error("Error processing message:", error.message);
        }
      },
    });
  } catch (error) {
    console.error("Failed to start consumer:", error.message);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\nShutting down consumer...");
  console.log(`Final stats: ${stats.processedCount} processed, ${stats.failedCount} failed`);
  await consumer.disconnect();
  await producer.disconnect();
  process.exit(0);
});

startConsumer();
