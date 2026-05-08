# Event Ticketing System

Backend-only Event Ticketing System built with a simple microservice-style Node.js architecture for the PPLBS assignment.

## Overview

The system provides authentication, event and ticket type management, order creation with quota handling, RabbitMQ-based notification messages, and a single API Gateway entry point.

```txt
Client
  -> API Gateway :3000
      -> Auth Service :3001
      -> Event Service :3002
      -> Order Service :3003

Order Service -> RabbitMQ queue: order_notifications -> Notification Service
```

## Services

| Service | Port | Responsibility |
|---|---:|---|
| API Gateway | 3000 | Request logging, rate limiting, routing |
| Auth Service | 3001 | Register, login, JWT generation |
| Event Service | 3002 | Events and ticket types |
| Order Service | 3003 | Orders, quota updates, RabbitMQ publish |
| Notification Service | - | RabbitMQ consumer and console notification logs |

## Prerequisites

- Node.js and npm
- MySQL
- RabbitMQ

This project assumes MySQL and RabbitMQ are already installed and running locally or on the deployment server.

## Database Setup

Create the shared assignment database:

```sql
CREATE DATABASE IF NOT EXISTS event_ticketing_db;
```

Sequelize sync is performed by the services when they start.

## Environment Variables

Create `.env` files by copying each service's `.env.example`.

```bash
cp api-gateway/.env.example api-gateway/.env
cp auth-service/.env.example auth-service/.env
cp event-service/.env.example event-service/.env
cp order-service/.env.example order-service/.env
cp notification-service/.env.example notification-service/.env
```

Use the same `JWT_SECRET` in Auth, Event, and Order services.

### API Gateway

```env
PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
EVENT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Auth, Event, and Order Services

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=event_ticketing_db
DB_USER=root
DB_PASSWORD=
JWT_SECRET=secret_key
```

Auth Service also uses:

```env
JWT_EXPIRES_IN=24h
```

Order Service also uses:

```env
RABBITMQ_URL=amqp://localhost
RABBITMQ_QUEUE=order_notifications
```

### Notification Service

```env
RABBITMQ_URL=amqp://localhost
RABBITMQ_QUEUE=order_notifications
```

## Install

From the project root:

```bash
npm run install:all
```

Or install a single service:

```bash
npm --prefix api-gateway install
npm --prefix auth-service install
npm --prefix event-service install
npm --prefix order-service install
npm --prefix notification-service install
```

## Run

Run all services together:

```bash
npm run dev
```

Run services separately:

```bash
npm --prefix api-gateway run dev
npm --prefix auth-service run dev
npm --prefix event-service run dev
npm --prefix order-service run dev
npm --prefix notification-service run dev
```

Use API Gateway for normal testing:

```txt
http://localhost:3000
```

## Response Format

Success:

```json
{
  "success": true,
  "message": "Success description",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

## Authentication

Use Bearer tokens for protected endpoints:

```txt
Authorization: Bearer <token>
```

JWT payload:

```json
{
  "id": 1,
  "name": "Customer User",
  "email": "user@mail.com",
  "role": "customer"
}
```

Roles:

- `admin`
- `customer`

## Role Permissions

| Action | Admin | Customer |
|---|---|---|
| Create, update, delete events | Yes | No |
| Read events | Yes | Yes |
| Create, update, delete ticket types | Yes | No |
| Read ticket types | Yes | Yes |
| Create orders | No | Yes |
| View orders | All orders | Own orders only |
| Update order status | Yes | No |

## Endpoint List

All endpoints below are intended to be called through the API Gateway at `http://localhost:3000`.

### Auth

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/auth/register` | No | - | Register user |
| POST | `/auth/login` | No | - | Login and receive JWT |

Register body:

```json
{
  "name": "Admin User",
  "email": "admin@mail.com",
  "password": "password123",
  "role": "admin"
}
```

Login body:

```json
{
  "email": "admin@mail.com",
  "password": "password123"
}
```

### Events and Ticket Types

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/events` | No | - | List events |
| GET | `/events/:id` | No | - | Event detail with ticket types |
| POST | `/events` | Yes | Admin | Create event |
| PUT | `/events/:id` | Yes | Admin | Update event |
| DELETE | `/events/:id` | Yes | Admin | Delete event |
| GET | `/events/:id/ticket-types` | No | - | List ticket types for event |
| POST | `/events/:id/ticket-types` | Yes | Admin | Create ticket type |
| PUT | `/ticket-types/:id` | Yes | Admin | Update ticket type |
| DELETE | `/ticket-types/:id` | Yes | Admin | Delete ticket type |

Create event body:

```json
{
  "title": "Konser Kampus",
  "description": "Konser tahunan kampus",
  "location": "Auditorium",
  "date": "2026-06-15T19:00:00.000Z"
}
```

Create ticket type body:

```json
{
  "name": "Regular",
  "price": 75000,
  "quota": 100
}
```

### Orders

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/orders` | Yes | Customer | Create order |
| GET | `/orders` | Yes | Admin or Customer | Admin sees all, customer sees own |
| GET | `/orders/:id` | Yes | Admin or Customer | Admin sees all, customer sees own |
| PUT | `/orders/:id/status` | Yes | Admin | Update status |

Create order body:

```json
{
  "ticketTypeId": 1,
  "quantity": 2
}
```

Update order status body:

```json
{
  "status": "cancelled"
}
```

Allowed statuses:

- `pending`
- `confirmed`
- `cancelled`

## RabbitMQ Flow

When a customer creates an order:

1. Order Service validates the customer JWT.
2. Order Service validates `ticketTypeId` and `quantity`.
3. Order Service checks ticket quota.
4. Order Service reduces quota and creates a `pending` order in a Sequelize transaction.
5. Order Service publishes an `ORDER_CREATED` message to RabbitMQ queue `order_notifications`.
6. Notification Service consumes the message and logs notification output.

Message format:

```json
{
  "event": "ORDER_CREATED",
  "data": {
    "orderId": 1,
    "userName": "Customer User",
    "userEmail": "customer@mail.com",
    "eventTitle": "Konser Kampus",
    "ticketType": "Regular",
    "quantity": 2,
    "totalPrice": 150000
  },
  "timestamp": "2026-05-08T10:00:00.000Z"
}
```

If RabbitMQ publish fails after an order is saved, the order response still succeeds and the error is logged.

## Manual Verification With Postman

Use API Gateway base URL:

```txt
http://localhost:3000
```

### 1. Health Checks

```txt
GET /health
```

Optional direct service checks:

```txt
GET http://localhost:3001/health
GET http://localhost:3002/health
GET http://localhost:3003/health
```

### 2. Register Admin

```txt
POST /auth/register
```

```json
{
  "name": "Admin User",
  "email": "admin@mail.com",
  "password": "password123",
  "role": "admin"
}
```

### 3. Register Customer

```txt
POST /auth/register
```

```json
{
  "name": "Customer User",
  "email": "customer@mail.com",
  "password": "password123"
}
```

### 4. Login Admin and Customer

```txt
POST /auth/login
```

```json
{
  "email": "admin@mail.com",
  "password": "password123"
}
```

Repeat for `customer@mail.com`. Save both returned tokens.

### 5. Admin Creates Event

```txt
POST /events
Authorization: Bearer <ADMIN_TOKEN>
```

```json
{
  "title": "Konser Kampus",
  "description": "Konser tahunan kampus",
  "location": "Auditorium",
  "date": "2026-06-15T19:00:00.000Z"
}
```

Save the returned `event.id`.

### 6. Admin Creates Ticket Type

```txt
POST /events/1/ticket-types
Authorization: Bearer <ADMIN_TOKEN>
```

```json
{
  "name": "Regular",
  "price": 75000,
  "quota": 10
}
```

Save the returned `ticketType.id`.

### 7. Public Lists Events

```txt
GET /events
```

### 8. Customer Creates Order

Make sure Notification Service is running before this step.

```txt
POST /orders
Authorization: Bearer <CUSTOMER_TOKEN>
```

```json
{
  "ticketTypeId": 1,
  "quantity": 2
}
```

Expected:

- Order response returns `201`.
- Order status is `pending`.
- Ticket quota decreases.
- Notification Service console logs an `ORDER_CREATED` notification.

### 9. Customer Lists Own Orders

```txt
GET /orders
Authorization: Bearer <CUSTOMER_TOKEN>
```

### 10. Admin Lists All Orders

```txt
GET /orders
Authorization: Bearer <ADMIN_TOKEN>
```

### 11. Customer Forbidden From Creating Event

```txt
POST /events
Authorization: Bearer <CUSTOMER_TOKEN>
```

Expected: `403`.

### 12. Unauthenticated Orders Request

```txt
GET /orders
```

Expected: `401`.

### 13. Cancelled Order Restores Quota

Check current quota:

```txt
GET /events/1/ticket-types
```

Cancel order:

```txt
PUT /orders/1/status
Authorization: Bearer <ADMIN_TOKEN>
```

```json
{
  "status": "cancelled"
}
```

Expected:

- Order status becomes `cancelled`.
- Ticket quota increases by the order quantity.
- Sending the same cancellation again does not restore quota twice.

### 14. Rate Limit Returns 429

Send more than `RATE_LIMIT_MAX` requests within the configured window.

Expected: `429`.

## Useful Commands

Check JavaScript syntax per service:

```bash
find auth-service event-service order-service api-gateway notification-service \
  -path '*/node_modules' -prune -o -name '*.js' -print -exec node --check {} \;
```

Check git status:

```bash
git status -sb
```
