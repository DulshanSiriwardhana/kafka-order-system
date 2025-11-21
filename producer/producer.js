const { Kafka } = require("kafkajs");
const avro = require("avsc");
const fs = require("fs");
const path = require("path");

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",").map((broker) => broker.trim());

const TOPIC_NAME = "orders";
const PRODUCER_INTERVAL_MS = 2000;
const SCHEMA_PATH = path.join(__dirname, "order.avsc");

const schema = avro.parse(
  JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"))
);

const kafka = new Kafka({
  clientId: "order-producer",
  brokers: KAFKA_BROKERS,
});

const producer = kafka.producer();

function generateOrder() {
  const randomId = Math.floor(Math.random() * 10000);
  const randomProductIndex = Math.floor(Math.random() * 10);
  const randomPrice = Math.random() * 100;

  return {
    orderId: randomId.toString(),
    product: `Item${randomProductIndex}`,
    price: randomPrice,
  };
}

async function sendOrderToKafka(order) {
  try {
    const encodedOrder = schema.toBuffer(order);

    await producer.send({
      topic: TOPIC_NAME,
      messages: [{ value: encodedOrder }],
    });

    console.log("✓ Sent order:", {
      orderId: order.orderId,
      product: order.product,
      price: order.price.toFixed(2),
    });
  } catch (error) {
    console.error("✗ Failed to send order:", error.message);
  }
}

async function startProducer() {
  try {
    await producer.connect();
    console.log("Producer connected to Kafka");

    setInterval(async () => {
      const order = generateOrder();
      await sendOrderToKafka(order);
    }, PRODUCER_INTERVAL_MS);
  } catch (error) {
    console.error("Failed to start producer:", error.message);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\nShutting down producer...");
  await producer.disconnect();
  process.exit(0);
});

startProducer();
