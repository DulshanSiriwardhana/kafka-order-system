FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile || npm install

# Copy application code
COPY . .

CMD ["node", "producer/producer.js"]

