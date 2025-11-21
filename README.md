# Kafka Order Processing System

Kafka-based order processing with Node.js and Avro.

## Run with Docker

```bash
docker-compose up
```

Stops everything:
```bash
docker-compose down
```

## Run Locally

1. Start Kafka on `localhost:9092`
2. Create topics:
   ```bash
   kafka-topics.sh --create --topic orders --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
   kafka-topics.sh --create --topic orders-dlq --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
   ```
3. Run producer and consumer:
   ```bash
   npm run producer
   npm run consumer
   ```

## How It Works

- Producer sends random orders every 2 seconds
- Consumer processes orders with 3 retry attempts
- Failed orders go to DLQ

