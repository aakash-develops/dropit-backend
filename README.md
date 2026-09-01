# DropIt — Real-Time Freight & Delivery Platform

> **A production-oriented backend for freight booking, driver bidding, real-time tracking, OTP-verified delivery, KYC, payments, and escrow-based payouts.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-brightgreen.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black.svg)](https://socket.io/)
[![Paytrail](https://img.shields.io/badge/Payments-Paytrail-purple.svg)](https://www.paytrail.com/)
[![License](https://img.shields.io/badge/License-ISC-orange.svg)](LICENSE)

---

## 🚀 Overview

**DropIt** is a real-time freight delivery platform that connects shippers with drivers through a complete digital logistics workflow.

The backend is responsible for the core platform lifecycle:

```text
Freight Creation
      ↓
Price Estimation
      ↓
Driver Discovery
      ↓
Bidding & Negotiation
      ↓
Trip Assignment
      ↓
Payment & Escrow
      ↓
Pickup Verification
      ↓
Real-Time GPS Tracking
      ↓
Proof of Delivery
      ↓
Delivery Verification
      ↓
Driver Payout
```

Unlike a basic CRUD backend, DropIt combines **transactional workflows, real-time communication, geospatial queries, financial state management, file processing, authentication, and KYC verification** into a single backend system.

---

# ✨ Engineering Highlights

## 💰 Dynamic Freight Price Protection

DropIt includes a server-side pricing engine that calculates the minimum acceptable freight rate before a shipment can be posted.

The estimation considers:

* Vehicle type
* Driving distance
* Load weight
* Platform pricing rules

This prevents clients from bypassing minimum pricing requirements and ensures that critical business rules are enforced at the API layer rather than trusted to the frontend.

```text
Vehicle Type
     +
Distance
     +
Load Weight
     ↓
Price Estimation Engine
     ↓
Minimum Allowed Rate
```

---

## 🤝 Turn-Based Driver Bidding

DropIt implements a structured negotiation system instead of unrestricted offer submissions.

### Key rules

* Drivers can submit offers and counter-offers.
* Negotiations are turn-based.
* Each driver is limited to **2 negotiation rounds**.
* Invalid or out-of-turn offers are rejected server-side.
* Once accepted, the agreed price is locked.
* Acceptance triggers generation of delivery verification credentials.

This provides a predictable negotiation state machine and prevents clients from manipulating bidding rules.

---

## 🔐 Escrow-Based Delivery Workflow

The payment lifecycle is tied directly to delivery verification.

A simplified workflow:

```text
Trip Accepted
     ↓
Payment Secured
     ↓
Funds Held in Escrow
     ↓
Pickup OTP Verified
     ↓
Shipment In Transit
     ↓
Proof of Delivery Uploaded
     ↓
Delivery OTP Verified
     ↓
Escrow Released
     ↓
10% Platform Fee
     +
90% Driver Earnings
```

The backend coordinates payment state, delivery state, OTP verification, POD submission, and driver wallet balances.

---

## 📍 Real-Time GPS Tracking

DropIt uses **Socket.IO** to provide live driver tracking without relying on continuous HTTP polling.

Drivers can broadcast their current coordinates while customers subscribed to the corresponding freight room receive location updates in real time.

```text
Driver Application
       │
       │ GPS coordinates
       ▼
  Socket.IO Server
       │
       │ Validate / relay
       ▼
 Freight Room
       │
       ├──────────────► Shipper
       │
       └──────────────► Tracking Clients
```

This architecture reduces unnecessary polling and provides a responsive tracking experience.

---

## 💬 Real-Time Freight Communication

Each freight request can have its own Socket.IO room.

The real-time layer supports:

* Freight room subscriptions
* Driver location updates
* New freight notifications
* Dispatch events
* Trip messaging
* Shipment-specific updates

This keeps communication scoped to the relevant shipment instead of broadcasting every event globally.

---

## 🪪 Driver KYC Pipeline

DropIt provides a complete driver verification workflow.

Drivers can submit:

* Selfie
* Driving license
* Vehicle registration / bluebook

Administrators can then move submissions through:

| Status            | Meaning                                                 |
| ----------------- | ------------------------------------------------------- |
| `approved`        | Driver has passed verification                          |
| `rejected`        | Submitted information was rejected                      |
| `action_required` | Driver must provide additional or corrected information |

The KYC system provides the foundation for restricting freight participation to verified drivers.

---

## 💳 Payment & Wallet Management

The backend integrates with **Paytrail** for payment processing and maintains driver financial state.

The wallet system distinguishes between:

* Available earnings
* Pending escrow
* Trip balances
* Driver payout amounts

Payment notifications are received through a dedicated Paytrail callback endpoint.

---

## 🖼️ Image Processing Pipeline

Freight and delivery workflows require image uploads, particularly for KYC and Proof of Delivery.

DropIt processes images using **Multer + Sharp**:

```text
Multipart Upload
      ↓
     Multer
      ↓
In-Memory Buffer
      ↓
     Sharp
      ↓
Resize / Compress / Optimize
      ↓
     WebP
      ↓
Local Storage
```

Converting images to WebP helps reduce storage requirements and improves delivery performance for client applications.

---

# 🏗️ System Architecture

DropIt uses a layered backend architecture separating HTTP APIs, real-time communication, business logic, media processing, and persistence.

```text
                         ┌───────────────────────────┐
                         │     Web / Mobile Apps     │
                         └─────────────┬─────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
              REST / HTTP                           WebSockets
              JWT Auth                              Socket.IO
                    │                                     │
                    ▼                                     ▼
        ┌──────────────────────┐             ┌──────────────────────┐
        │   Express.js API     │             │   Socket.IO Server   │
        │    Route Layer       │             │   Real-Time Engine   │
        └──────────┬───────────┘             └──────────┬───────────┘
                   │                                    │
          ┌────────┴─────────┐              ┌───────────┼───────────┐
          │                  │              │           │           │
          ▼                  ▼              ▼           ▼           ▼
   ┌──────────────┐   ┌──────────────┐  Driver GPS   Freight     Dispatch
   │  Business    │   │ Media Layer  │  Tracking      Rooms       Events
   │  Services    │   │              │
   │              │   │ Multer       │
   │ • Pricing    │   │ Sharp        │
   │ • Bidding    │   │ WebP         │
   │ • OTP        │   └──────┬───────┘
   │ • Escrow     │          │
   │ • Payments   │          ▼
   │ • KYC        │   ┌──────────────┐
   └──────┬───────┘   │ Local Media  │
          │           └──────────────┘
          │
          ▼
   ┌────────────────────────────────────────┐
   │              MongoDB                   │
   │            Mongoose ODM                │
   │                                        │
   │ Freight │ Bids │ Trips │ Wallets       │
   │ Payments │ KYC │ GeoJSON │ Messages    │
   └────────────────────────────────────────┘
```

---

# 🧩 Core Backend Domains

| Domain               | Responsibility                                                 |
| -------------------- | -------------------------------------------------------------- |
| **Freight Requests** | Load creation, discovery, assignment, and lifecycle management |
| **Pricing Engine**   | Minimum freight rate calculation                               |
| **Bidding**          | Driver offers, counters, negotiation limits, and acceptance    |
| **Trips**            | Assigned freight and delivery lifecycle                        |
| **Escrow**           | Payment locking and release workflow                           |
| **OTP Verification** | Pickup and delivery authorization                              |
| **GPS Tracking**     | Real-time driver location broadcasting                         |
| **KYC**              | Driver identity and vehicle verification                       |
| **Payments**         | Paytrail checkout and payment callbacks                        |
| **Wallets**          | Driver earnings and pending balances                           |
| **Media**            | Image upload, compression, and WebP conversion                 |
| **Messaging**        | Freight-specific real-time communication                       |

---

# 🔌 REST API

All protected endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Freight Requests

**Base URL:** `/api/requests`

| Method | Endpoint          | Description                                  | Auth |
| ------ | ----------------- | -------------------------------------------- | ---- |
| `POST` | `/estimate-price` | Calculate minimum freight price              | ✅    |
| `POST` | `/`               | Create freight request with price validation | ✅    |
| `GET`  | `/my`             | List authenticated shipper's requests        | ✅    |
| `GET`  | `/nearby`         | Find nearby open loads using coordinates     | ✅    |
| `GET`  | `/driver-trips`   | Get active driver trips                      | ✅    |
| `GET`  | `/`               | Get active freight feed                      | ✅    |
| `GET`  | `/:id`            | Get freight request details                  | ✅    |
| `PUT`  | `/:id/accept`     | Directly accept a freight request            | ✅    |
| `POST` | `/:id/pod`        | Upload Proof of Delivery                     | ✅    |
| `POST` | `/:id/verify-otp` | Verify pickup or delivery OTP                | ✅    |

---

## Bidding & Negotiation

**Base URL:** `/api/bids`

| Method | Endpoint              | Description                     | Auth |
| ------ | --------------------- | ------------------------------- | ---- |
| `POST` | `/`                   | Submit offer or counter-offer   | ✅    |
| `GET`  | `/request/:requestId` | Retrieve bid history            | ✅    |
| `PUT`  | `/:bidId/accept`      | Accept offer and lock trip rate | ✅    |

### Negotiation Constraints

```text
Maximum negotiation rounds per driver: 2

Shipper
   ↕
Driver
   ↕
Counter Offer
   ↕
Final Offer
   ↓
Accepted
   ↓
Rate Locked
```

---

# 🪪 KYC API

**Base URL:** `/api/kyc`

| Method | Endpoint         | Description                 | Auth  |
| ------ | ---------------- | --------------------------- | ----- |
| `POST` | `/`              | Submit driver KYC documents | ✅     |
| `GET`  | `/`              | Retrieve current KYC status | ✅     |
| `PUT`  | `/:kycId/status` | Update KYC review status    | Admin |

---

# 💰 Payments & Wallet API

**Base URL:** `/api/payments`

| Method | Endpoint             | Description                         | Auth   |
| ------ | -------------------- | ----------------------------------- | ------ |
| `POST` | `/paytrail/create`   | Create Paytrail checkout session    | ✅      |
| `GET`  | `/wallet/driver`     | Retrieve driver wallet and earnings | ✅      |
| `ALL`  | `/paytrail/callback` | Receive Paytrail payment callbacks  | Public |

---

# ⚡ Real-Time Socket API

DropIt uses Socket.IO for real-time shipment coordination.

| Event                     | Direction       | Payload                                     | Purpose                       |
| ------------------------- | --------------- | ------------------------------------------- | ----------------------------- |
| `join_freight_room`       | Client → Server | `{ freightId }`                             | Join a freight-specific room  |
| `update_driver_location`  | Driver → Server | `{ freightId, latitude, longitude }`        | Send driver GPS coordinates   |
| `driver_location_updated` | Server → Room   | `{ latitude, longitude }`                   | Broadcast driver location     |
| `broadcast_new_freight`   | Client → Server | `newFreightData`                            | Notify drivers of new freight |
| `send_freight_message`    | Client → Server | `{ freightId, senderId, senderName, text }` | Send trip message             |

---

# 🔄 End-to-End Freight Lifecycle

```text
┌─────────────────────┐
│  Create Freight     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Estimate Min Price  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Publish Freight     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Driver Discovery    │
│ + Real-Time Alerts  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Bidding / Negotiation│
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Offer Accepted      │
│ Rate Locked         │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Payment / Escrow    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Pickup OTP          │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Live GPS Tracking   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Proof of Delivery   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Delivery OTP        │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Escrow Released     │
└──────────┬──────────┘
           ↓
      ┌────┴────┐
      ↓         ↓
   10% Fee    90% Driver
              Earnings
```

---

# 🔐 Authentication & Security

DropIt uses JWT-based authentication for protected API operations.

Security-sensitive business rules are enforced on the backend, including:

* JWT authentication
* Authorization checks
* Minimum freight pricing
* Bidding constraints
* Turn-based negotiation
* OTP verification
* Escrow state transitions
* Wallet operations
* KYC review states
* File upload processing

### Production Security Recommendations

For production deployment, the system should be configured with:

* HTTPS/TLS
* Secure secret management
* Request validation
* Rate limiting
* File size and MIME-type validation
* Payment webhook signature verification
* Strict KYC document authorization
* Database access controls
* Audit logging for financial operations
* Secure CORS configuration

> **Never commit `.env` files, JWT secrets, payment credentials, or API keys to Git.**

---

# 🛠️ Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO
* JWT

### Payments & Communication

* Paytrail
* Resend

### File Processing

* Multer
* Sharp
* WebP

### Data & Infrastructure Concepts

* GeoJSON / geospatial queries
* REST APIs
* WebSockets
* JWT authentication
* Escrow workflows
* Transactional financial state
* Real-time event-driven architecture

---

# 📦 Local Development

## Prerequisites

Make sure you have installed:

* **Node.js 18+**
* **npm**
* **MongoDB**

Optional integrations:

* Paytrail account/configuration
* Resend API key

---

## 1. Clone the Repository

```bash
git clone https://github.com/aakash-develops/dropit-backend.git
cd dropit-backend
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000

MONGO_URL=mongodb://localhost:27017/dropit

JWT_SECRET=your_jwt_secret_key

RESEND_API_KEY=re_your_resend_api_key
```

---

## 4. Start Development Server

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:5000
```

---

## 5. Start Production Server

```bash
npm start
```

---

# 🧪 Development Philosophy

DropIt is designed around several backend engineering principles.

### Server-Side Enforcement

Business-critical rules are validated on the server rather than relying on client-side behavior.

### Event-Driven Communication

Real-time operations such as GPS tracking, freight notifications, and trip messaging use WebSockets rather than constant polling.

### Domain Separation

Freight, bidding, payments, KYC, wallet, and communication concerns are treated as separate backend domains.

### Financial Integrity

Payment, escrow, commission, and wallet state transitions should be handled carefully to avoid duplicate payouts or inconsistent balances.

### Performance-Aware Media Handling

Images are compressed and converted before storage to reduce unnecessary bandwidth and storage consumption.

---

# 📊 What This Project Demonstrates

From an engineering perspective, DropIt demonstrates experience with:

* Designing RESTful APIs
* Building real-time WebSocket systems
* Implementing geospatial queries
* Designing stateful business workflows
* Building bidding and negotiation logic
* Implementing OTP-based verification
* Integrating payment gateways
* Managing escrow-style financial workflows
* Building driver wallet systems
* Implementing KYC pipelines
* Handling multipart file uploads
* Performing server-side image optimization
* Designing JWT authentication
* Working with MongoDB and Mongoose
* Building event-driven backend features

---

# 🗺️ Future Improvements

Potential improvements for scaling the platform include:

* Redis for distributed Socket.IO and caching
* Background job processing for asynchronous workloads
* Object storage such as S3-compatible storage for media
* Dedicated notification services
* Advanced observability and structured logging
* Automated integration and end-to-end testing
* Horizontal API scaling
* Database indexing and query optimization
* CI/CD pipelines
* Containerized deployment with Docker

---

# 📁 Repository

**Author:** [aakash-develops](https://github.com/aakash-develops)

**Project:** [DropIt Backend](https://github.com/aakash-develops/dropit-backend)

---

# 📄 License

This project is distributed under the **ISC License**.

See [`LICENSE`](LICENSE) for the complete license terms.

---

<p align="center">
  Built with Node.js, Express, MongoDB & Socket.IO
</p>
<p align="center">
  <strong>DropIt — Connecting freight with reliable delivery.</strong>
</p>
