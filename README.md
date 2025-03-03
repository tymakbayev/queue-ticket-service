# Queue Ticket Service

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A microservice for generating sequential ticket numbers for multiple queues. The service accepts a queue ID and returns a four-digit ticket number that increments by one with each request. When the ticket number reaches 9999, it resets to 0000.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [API Endpoints](#api-endpoints)
  - [Examples](#examples)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Development](#development)
  - [Running Tests](#running-tests)
  - [Docker](#docker)
- [API Documentation](#api-documentation)
- [Storage Options](#storage-options)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- Generate sequential ticket numbers for multiple independent queues
- Four-digit ticket numbers (0000-9999) with automatic reset
- Support for multiple storage backends (in-memory and Redis)
- RESTful API for queue management
- Comprehensive error handling and logging
- Docker support for easy deployment
- Configurable through environment variables

## Requirements

- Node.js 14.x or higher
- npm or yarn
- Redis (optional, for persistent storage)

## Installation

### Local Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/queue-ticket-service.git
cd queue-ticket-service
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on the example:

```bash
cp .env.example .env
```

4. Edit the `.env` file to configure your environment.

5. Start the service:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### Docker Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/queue-ticket-service.git
cd queue-ticket-service
```

2. Build and start the service using Docker Compose:

```bash
docker-compose up -d
```

This will start both the service and a Redis instance (if configured to use Redis).

## Configuration

The service can be configured using environment variables or a `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port on which the service will listen | `3000` |
| `STORAGE_TYPE` | Storage backend (`memory` or `redis`) | `memory` |
| `REDIS_HOST` | Redis server hostname | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis server password | `undefined` |
| `REDIS_DB` | Redis database number | `0` |
| `REDIS_KEY_PREFIX` | Prefix for Redis keys | `ticket:` |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` |
| `NODE_ENV` | Environment (development, production) | `development` |

## Usage

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queue/:queueId/ticket` | Get a new ticket for the specified queue |
| GET | `/api/queue/:queueId/status` | Get the current status of the specified queue |
| POST | `/api/queue/:queueId/reset` | Reset the ticket counter for the specified queue |

### Examples

#### Get a new ticket

```bash
curl -X GET http://localhost:3000/api/queue/checkout/ticket
```

Response:

```json
{
  "ticket": "0001",
  "queueId": "checkout"
}
```

#### Get queue status

```bash
curl -X GET http://localhost:3000/api/queue/checkout/status
```

Response:

```json
{
  "queueId": "checkout",
  "currentTicket": "0001",
  "ticketsIssued": 1
}
```

#### Reset queue counter

```bash
curl -X POST http://localhost:3000/api/queue/checkout/reset
```

Response:

```json
{
  "success": true,
  "queueId": "checkout"
}
```

## Architecture

The service follows a clean architecture approach with the following layers:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Repositories**: Manage data access
- **Adapters**: Provide interfaces to external systems (storage)
- **Models**: Define data structures
- **Utils**: Provide utility functions
- **Middleware**: Process requests before they reach controllers

## Project Structure

```
queue-ticket-service/
├── src/
│   ├── adapters/           # Storage adapters (Redis, In-Memory)
│   ├── config/             # Configuration management
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── models/             # Data models
│   ├── repositories/       # Data access layer
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   ├── App.js              # Express application setup
│   └── index.js            # Application entry point
├── tests/
│   ├── integration/        # Integration tests
│   └── unit/               # Unit tests
├── logs/                   # Log files (production)
├── .env.example            # Example environment variables
├── .gitignore              # Git ignore file
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Docker build instructions
├── jest.config.js          # Jest configuration
├── package.json            # Project dependencies and scripts
└── README.md               # Project documentation
```

## Development

### Running Tests

Run unit tests:

```bash
npm run test:unit
```

Run integration tests:

```bash
npm run test:integration
```

Run all tests:

```bash
npm test
```

### Docker

Build the Docker image:

```bash
docker build -t queue-ticket-service .
```

Run the container:

```bash
docker run -p 3000:3000 -e STORAGE_TYPE=memory queue-ticket-service
```

## API Documentation

### GET /api/queue/:queueId/ticket

Get a new ticket for the specified queue.

**Parameters:**
- `queueId` (path parameter): The ID of the queue (required)

**Response:**
- `200 OK`: Returns the ticket number and queue ID
  ```json
  {
    "ticket": "0001",
    "queueId": "checkout"
  }
  ```
- `400 Bad Request`: If the queue ID is missing
- `500 Internal Server Error`: If an error occurs

### GET /api/queue/:queueId/status

Get the current status of the specified queue.

**Parameters:**
- `queueId` (path parameter): The ID of the queue (required)

**Response:**
- `200 OK`: Returns the queue status
  ```json
  {
    "queueId": "checkout",
    "currentTicket": "0001",
    "ticketsIssued": 1
  }
  ```
- `400 Bad Request`: If the queue ID is missing
- `500 Internal Server Error`: If an error occurs

### POST /api/queue/:queueId/reset

Reset the ticket counter for the specified queue.

**Parameters:**
- `queueId` (path parameter): The ID of the queue (required)

**Response:**
- `200 OK`: Returns success status and queue ID
  ```json
  {
    "success": true,
    "queueId": "checkout"
  }
  ```
- `400 Bad Request`: If the queue ID is missing
- `500 Internal Server Error`: If an error occurs

## Storage Options

The service supports two storage backends:

### In-Memory Storage

- Simple and fast
- Data is lost when the service restarts
- Good for development or stateless deployments
- No additional dependencies

To use in-memory storage, set `STORAGE_TYPE=memory` in your environment or `.env` file.

### Redis Storage

- Persistent storage
- Data survives service restarts
- Good for production or when multiple instances are needed
- Requires a Redis server

To use Redis storage, set `STORAGE_TYPE=redis` in your environment or `.env` file, and configure the Redis connection parameters.

## Troubleshooting

### Common Issues

**Service doesn't start:**
- Check if the port is already in use
- Verify that all required environment variables are set
- Check the logs for error messages

**Redis connection issues:**
- Verify that Redis is running and accessible
- Check Redis connection parameters in the `.env` file
- Try connecting to Redis using a Redis CLI to verify connectivity

**Tickets not incrementing properly:**
- Check if multiple instances are running with in-memory storage
- Verify that the Redis connection is working properly if using Redis storage
- Check the logs for any error messages related to ticket generation

### Logging

The service uses Winston for logging. Logs are written to the console in development mode and to files in the `logs/` directory in production mode.

To change the log level, set the `LOG_LEVEL` environment variable to one of: `error`, `warn`, `info`, or `debug`.

## License

This project is licensed under the MIT License - see the LICENSE file for details.