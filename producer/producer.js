const { Kafka } = require("kafkajs");
const avro = require("avsc");
const fs = require("fs");

const schema = avro.parse(JSON.parse(fs.readFileSync("./order.avsc", "utf8")));

const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",").map(b => b.trim());

const kafka = new Kafka({
  clientId: "order-producer",
  brokers: brokers,
});

const producer = kafka.producer();

async function sendOrder() {
  await producer.connect();

  setInterval(async () => {
    const order = {
      orderId: Math.floor(Math.random() * 10000).toString(),
      product: "Item" + Math.floor(Math.random() * 10),
      price: Math.random() * 100,
    };

    const encoded = schema.toBuffer(order);

    await producer.send({
      topic: "orders",
      messages: [{ value: encoded }],
    });

    console.log("Sent:", order);
  }, 2000);
}

sendOrder();
