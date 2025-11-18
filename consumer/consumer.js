const { Kafka } = require("kafkajs");
const avro = require("avsc");
const fs = require("fs");

const schema = avro.parse(JSON.parse(fs.readFileSync("./order.avsc", "utf8")));

const kafka = new Kafka({
  clientId: "order-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "order-group" });
const producer = kafka.producer();

let total = 0;
let count = 0;

async function processOrder(order) {
  if (Math.random() < 0.2) throw new Error("Random simulated failure");
}

async function run() {
  await producer.connect();
  await consumer.connect();

  await consumer.subscribe({ topic: "orders", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      let order = schema.fromBuffer(message.value);

      let attempts = 0;
      let success = false;

      while (attempts < 3 && !success) {
        try {
          await processOrder(order);
          success = true;

          total += order.price;
          count++;

          console.log(
            `Order processed: ${order.orderId} | Running Avg: ${(total / count).toFixed(2)}`
          );

        } catch {
          attempts++;
          console.log(`Retry attempt ${attempts} for order ${order.orderId}`);
        }
      }

      if (!success) {
        await producer.send({
          topic: "orders-dlq",
          messages: [{ value: schema.toBuffer(order) }],
        });

        console.log(`Moved to DLQ: ${order.orderId}`);
      }
    },
  });
}

run();
