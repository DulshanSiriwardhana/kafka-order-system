# Kafka Order Processing System

A Kafka-based order processing system using Node.js and Avro schema serialization.

## Quick Start with Docker (Recommended)

Run everything with one command:

```bash
docker-compose up
```

This will start:
- Zookeeper
- Kafka
- Producer (sends orders every 2 seconds)
- Consumer (processes orders with retry logic)

To stop everything:
```bash
docker-compose down
```

To view logs:
```bash
docker-compose logs -f producer consumer
```

## Prerequisites (For Local Development)

1. **Kafka** running on `localhost:9092`
2. **Node.js** installed
3. Dependencies installed (run `npm install` or `yarn install` if needed)

## Setup Kafka Topics

Before running, ensure Kafka topics are created:

```bash
# Create the orders topic
kafka-topics.sh --create --topic orders --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

# Create the dead letter queue topic
kafka-topics.sh --create --topic orders-dlq --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

## Running the System

### Option 1: Using npm scripts (Recommended)

**Terminal 1 - Start the Producer:**
```bash
npm run producer
```

**Terminal 2 - Start the Consumer:**
```bash
npm run consumer
```

### Option 2: Run directly with Node.js

**Terminal 1 - Start the Producer:**
```bash
cd producer && node producer.js
```

**Terminal 2 - Start the Consumer:**
```bash
cd consumer && node consumer.js
```

## How It Works

- **Producer**: Generates random orders every 2 seconds and sends them to the `orders` topic
- **Consumer**: 
  - Consumes orders from the `orders` topic
  - Processes orders with retry logic (up to 3 attempts)
  - Calculates running average price
  - Moves failed orders to `orders-dlq` topic after retries exhausted

## Project Structure

```
kafka-order-system/
├── producer/
│   ├── producer.js    # Kafka producer that sends orders
│   └── order.avsc     # Avro schema for orders
├── consumer/
│   ├── consumer.js    # Kafka consumer that processes orders
│   └── order.avsc     # Avro schema for orders
├── docker-compose.yml # Docker Compose configuration
├── Dockerfile         # Docker image for Node.js app
├── .dockerignore     # Docker ignore file
└── package.json       # Node.js dependencies and scripts
```

