# DropIt— Back-End API

> A real-time freight delivery, bidding, and escrow financial platform built with **Node.js**, **Express.js**, **MongoDB**, and **Socket.IO**.

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)
![Express.js](https://img.shields.io/badge/Express.js-v4.18-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%20v8-brightgreen.svg)
![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.8-black.svg)
![License](https://img.shields.io/badge/License-ISC-orange.svg)

---

## Overview

**DropIt (`bhariya`)** is a backend platform for real-time freight transportation and delivery management.

The API supports the complete freight lifecycle, from load creation and price estimation through driver bidding, trip assignment, GPS tracking, OTP-based pickup and delivery verification, escrow management, Proof of Delivery (POD), and driver payouts.

The backend exposes a RESTful API for standard application operations and a **Socket.IO WebSocket layer** for real-time communication and location tracking.

### Core Technology Stack

* **Runtime:** Node.js 18+
* **Framework:** Express.js 4.18
* **Database:** MongoDB
* **ODM:** Mongoose 8
* **Real-Time Communication:** Socket.IO 4.8
* **Authentication:** JWT
* **File Uploads:** Multer
* **Image Processing:** Sharp
* **Payments:** Paytrail
* **Email:** Resend
* **License:** ISC

---

## Key Features

### 💰 Base Floor Rate Protection

DropIt includes a built-in price estimation engine through `estimatePrice`.

The engine dynamically calculates the minimum allowable freight rate using factors such as:

* Vehicle type
* Driving distance
* Load weight

This prevents shippers from creating freight requests below the platform's minimum calculated rate.

---

### 🤝 Turn-Based Bidding & Negotiation

The bidding system provides structured negotiations between shippers and drivers.

Key characteristics include:

* Driver offer and counter-offer support
* Maximum of **2 negotiation rounds per driver**
* Strict turn-based negotiation
* Offer validation and rate locking
* Automatic trip confirmation when an offer is accepted
* Automatic generation of pickup and delivery OTPs

Once a bid is accepted, the agreed rate becomes locked for the trip.

---

### 📍 Real-Time GPS Tracking & Communication

The backend uses **Socket.IO** to provide real-time freight coordination.

Supported functionality includes:

* Driver GPS location updates
* Freight-specific Socket.IO rooms
* Real-time load updates
* Driver dispatch notifications
* Shipment tracking
* In-app freight chat
* Asynchronous trip communication

---

### 🔐 OTP-Based Escrow Verification

The delivery workflow uses a two-stage verification mechanism:

1. **Pickup OTP**
2. **Delivery OTP**

The escrow workflow is designed to:

1. Lock the trip payment.
2. Verify the pickup using an OTP.
3. Track the active delivery.
4. Require Proof of Delivery (POD).
5. Verify the delivery OTP.
6. Calculate the platform commission.
7. Release the driver's net payout.

The platform commission is currently configured at **10%**, with **90%** of the applicable trip amount transferred to the driver's wallet.

Financial operations are designed to execute atomically where supported by the underlying database workflow.

---

### 🪪 Driver KYC & Verification

The platform includes a driver identity verification pipeline supporting multipart document submissions.

KYC submissions can include:

* Driver selfie
* Driving license
* Vehicle registration / bluebook

Administrative review supports the following states:

* `approved`
* `rejected`
* `action_required`

This allows administrators to approve verified drivers, reject invalid submissions, or request additional documentation.

---

### 💳 Payments & Driver Wallets

DropIt integrates with **Paytrail** for online payment processing.

The backend also provides driver wallet functionality for tracking:

* Available earnings
* Pending escrow
* Trip-related balances
* Driver payout information

Paytrail payment notifications are handled through a public callback/webhook endpoint.

---

### 🖼️ Media Processing

Uploaded images are processed using **Multer** and **Sharp**.

The media pipeline:

1. Receives image uploads in memory.
2. Processes the uploaded image with Sharp.
3. Compresses and optimizes the image.
4. Converts the image to WebP where applicable.
5. Stores the resulting web-ready media locally.

This reduces storage requirements and improves image delivery performance.

---

# Architecture

The backend follows a layered architecture combining REST APIs, real-time WebSocket communication, business services, media processing, and MongoDB persistence.

```text
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│                 Mobile App / Web Application                │
└──────────────────────┬──────────────────────┬───────────────┘
                       │                      │
              HTTP / REST API          WebSocket / Socket.IO
              JWT Authentication       Real-Time Events
                       │                      │
                       ▼                      ▼
        ┌────────────────────────┐  ┌────────────────────────┐
        │    Express.js API      │  │    Socket.IO Server    │
        │      Route Layer       │  │    Real-Time Engine    │
        └────────────┬───────────┘  └────────────┬───────────┘
                     │                           │
          ┌──────────┴──────────┐       ┌────────┴───────────┐
          │                     │       │                    │
          ▼                     ▼       ▼                    ▼
┌──────────────────┐  ┌────────────────┐ ┌──────────────┐ ┌────────────────┐
│ Business         │  │ Media Pipeline │ │ Driver GPS   │ │ Freight Rooms  │
│ Services         │  │                │ │ Location     │ │ & Chat         │
│                  │  │ Multer         │ │ Relay        │ │                │
│ • Rate Rules     │  │ Sharp          │ │              │ │ • Dispatch     │
│ • Bidding        │  │ WebP           │ │              │ │ • Messaging    │
│ • OTP            │  │ Compression    │ │              │ │ • Updates      │
│ • Escrow         │  └───────┬────────┘ └──────────────┘ └────────────────┘
│ • Payments       │          │
└────────┬─────────┘          ▼
         │             ┌───────────────┐
         │             │ Local Uploads │
         │             └───────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                         │
│                     Mongoose Schemas                        │
│                                                             │
│  • Freight Requests       • Bids & Negotiations             │
│  • Trips                  • Wallets                         │
│  • Payments               • KYC Records                     │
│  • GeoJSON Coordinates    • Chat / Trip Data                │
└─────────────────────────────────────────────────────────────┘
```

---

# Environment Variables

Create a `.env` file in the root directory.

| Variable         | Type   | Description                               | Example                            |
| ---------------- | ------ | ----------------------------------------- | ---------------------------------- |
| `PORT`           | Number | Port used by the Express server           | `5000`                             |
| `MONGO_URL`      | String | MongoDB connection string                 | `mongodb://localhost:27017/dropit` |
| `JWT_SECRET`     | String | Secret used to sign and verify JWT tokens | `your_jwt_secret_key`              |
| `RESEND_API_KEY` | String | Resend API key for transactional email    | `re_your_resend_api_key`           |

> **Security:** Never commit your `.env` file, JWT secrets, payment credentials, or API keys to source control.

---

# Authentication

Protected API endpoints require a valid JWT access token.

Include the token in the HTTP `Authorization` header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Unless explicitly marked as public, the API endpoints documented below require authentication.

---

# API Reference

## Freight Requests

**Base URL:** `/api/requests`

| Method | Endpoint          | Description                                                         | Authentication |
| ------ | ----------------- | ------------------------------------------------------------------- | -------------- |
| `POST` | `/estimate-price` | Calculate the minimum freight rate before posting a request         | Required       |
| `POST` | `/`               | Create a new freight request and enforce the minimum floor price    | Required       |
| `GET`  | `/my`             | List freight requests created by the authenticated shipper          | Required       |
| `GET`  | `/nearby`         | Find open loads near supplied geospatial coordinates (`lng`, `lat`) | Required       |
| `GET`  | `/driver-trips`   | Fetch active trips assigned to the authenticated driver             | Required       |
| `GET`  | `/`               | View the global active freight feed                                 | Required       |
| `GET`  | `/:id`            | Retrieve details for a specific freight request                     | Required       |
| `PUT`  | `/:id/accept`     | Directly accept a trip at its current price                         | Required       |
| `POST` | `/:id/pod`        | Upload Proof of Delivery cargo imagery                              | Required       |
| `POST` | `/:id/verify-otp` | Verify pickup or delivery OTPs                                      | Required       |

---

## Bidding & Negotiations

**Base URL:** `/api/bids`

| Method | Endpoint              | Description                                                           | Authentication |
| ------ | --------------------- | --------------------------------------------------------------------- | -------------- |
| `POST` | `/`                   | Submit a new offer or counter-offer                                   | Required       |
| `GET`  | `/request/:requestId` | Retrieve chronologically sorted bidding history for a freight request | Required       |
| `PUT`  | `/:bidId/accept`      | Accept an offer, lock the agreed rate, and generate verification OTPs | Required       |

### Bidding Rules

The negotiation system enforces:

* Turn-based communication between shipper and driver
* A maximum of **2 rounds per driver**
* Validated offer amounts
* Rate locking after acceptance
* OTP generation following successful bid acceptance

---

## Driver KYC

**Base URL:** `/api/kyc`

| Method | Endpoint         | Description                                                                     | Authentication   |
| ------ | ---------------- | ------------------------------------------------------------------------------- | ---------------- |
| `POST` | `/`              | Submit driver KYC documents including license, selfie, and vehicle registration | Required         |
| `GET`  | `/`              | Retrieve the authenticated driver's current KYC status                          | Required         |
| `PUT`  | `/:kycId/status` | Approve, reject, or request changes to a KYC submission                         | Required / Admin |

### KYC Statuses

| Status            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `approved`        | Driver verification has been successfully completed           |
| `rejected`        | Submitted documents were rejected                             |
| `action_required` | Additional information or corrected documentation is required |

---

## Payments & Wallet

**Base URL:** `/api/payments`

| Method | Endpoint             | Description                                                 | Authentication |
| ------ | -------------------- | ----------------------------------------------------------- | -------------- |
| `POST` | `/paytrail/create`   | Create a Paytrail checkout/payment session                  | Required       |
| `GET`  | `/wallet/driver`     | Retrieve driver earnings, pending escrow, and trip balances | Required       |
| `ALL`  | `/paytrail/callback` | Receive Paytrail payment notifications/webhooks             | Public         |

> The Paytrail callback endpoint must remain publicly accessible so Paytrail can deliver payment notifications to the backend.

---

# Real-Time API

DropIt uses **Socket.IO** for real-time freight coordination, tracking, and communication.

Clients connect to the Socket.IO server and exchange events using structured payloads.

## Socket Events

| Event                     | Direction       | Payload                                     | Purpose                                                       |
| ------------------------- | --------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `join_freight_room`       | Client → Server | `{ freightId }`                             | Subscribe a client to updates for a specific freight request  |
| `update_driver_location`  | Driver → Server | `{ freightId, latitude, longitude }`        | Send the driver's current GPS coordinates                     |
| `driver_location_updated` | Server → Room   | `{ latitude, longitude }`                   | Broadcast updated driver coordinates to freight subscribers   |
| `broadcast_new_freight`   | Client → Server | `newFreightData`                            | Notify nearby drivers about a newly available freight request |
| `send_freight_message`    | Client → Server | `{ freightId, senderId, senderName, text }` | Send an in-app freight/trip chat message                      |

---

# Freight Tracking Flow

A typical real-time tracking workflow is:

```text
Driver App
    │
    │ update_driver_location
    ▼
Socket.IO Server
    │
    │ Validate / process location
    ▼
Freight Room
    │
    │ driver_location_updated
    ▼
Shipper / Tracking Clients
    │
    ▼
Live Driver Location
```

Clients can join a freight-specific room using:

```text
join_freight_room
```

Once subscribed, clients receive relevant freight updates without needing to repeatedly poll the REST API.

---

# Escrow & Delivery Flow

The financial and delivery workflow can be summarized as follows:

```text
Freight Request Created
        │
        ▼
Price Validation
        │
        ▼
Driver Bidding / Direct Acceptance
        │
        ▼
Offer Accepted
        │
        ├──► Trip Rate Locked
        │
        └──► Pickup & Delivery OTPs Generated
                     │
                     ▼
              Payment / Escrow
                     │
                     ▼
               Pickup OTP
                     │
                     ▼
                In Transit
                     │
                     ▼
                 POD Upload
                     │
                     ▼
              Delivery OTP
                     │
                     ▼
             Delivery Verified
                     │
                     ▼
              Commission Applied
                     │
             ┌───────┴───────┐
             ▼               ▼
       Platform Fee      Driver Wallet
           10%                90%
```

---

# Media Upload Pipeline

Images submitted through the API are processed before being stored.

```text
Client Upload
     │
     ▼
Multer
     │
     ▼
In-Memory Image Buffer
     │
     ▼
Sharp
     │
     ├──► Resize / Optimize
     │
     ├──► Compress
     │
     └──► Convert to WebP
              │
              ▼
       Local File Storage
```

This approach helps reduce image size while maintaining suitable quality for web and mobile applications.

---

# Local Development Setup

## Prerequisites

Before running the project locally, make sure you have:

* Node.js 18 or later
* npm
* MongoDB
* A Paytrail merchant/integration configuration if payment functionality is required
* A Resend API key if email functionality is required

---

## 1. Clone the Repository

```bash
git clone https://github.com/aakash-develops/dropit-backend.git
cd dropit-backend
```

> Replace the repository URL with the actual project repository.

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

Use secure, environment-specific credentials for production deployments.

---

## 4. Start the Development Server

```bash
npm run dev
```

The API should then be available on the configured port.

For example:

```text
http://localhost:5000
```

---

## 5. Start the Production Server

```bash
npm start
```

---

# Suggested Project Responsibilities

The backend can be conceptually divided into the following responsibilities:

| Component          | Responsibility                                   |
| ------------------ | ------------------------------------------------ |
| Express Routes     | HTTP API endpoints and request handling          |
| Authentication     | JWT-based authorization                          |
| Business Services  | Freight, bidding, escrow, OTP, and payment rules |
| MongoDB / Mongoose | Persistent application data                      |
| Socket.IO          | Real-time tracking, dispatch, and communication  |
| Multer             | Multipart file uploads                           |
| Sharp              | Image processing and optimization                |
| Paytrail           | Payment processing                               |
| Resend             | Transactional email                              |

---

# Security Considerations

Because DropIt handles user identity, payment workflows, freight information, and financial balances, production deployments should pay particular attention to:

* Secure JWT secret management
* Environment variable protection
* HTTPS/TLS for API and WebSocket connections
* Authentication and authorization checks
* Input validation
* File type and file size validation
* KYC document access control
* Payment webhook verification
* Rate limiting
* Secure OTP generation and validation
* Database access controls
* Protection against unauthorized wallet operations
* Audit logging for financial and administrative actions

> Never expose secrets, payment credentials, KYC documents, or internal administrative endpoints to unauthorized clients.

---

# API Design Principles

The backend is designed around several core principles:

### Authentication First

Protected operations require a valid JWT token and appropriate user authorization.

### Server-Side Business Rules

Critical rules such as minimum freight rates, bidding limits, OTP verification, and escrow state transitions should be enforced on the server rather than trusted to client applications.

### Real-Time Where Appropriate

REST APIs handle persistent CRUD-style operations, while Socket.IO handles time-sensitive updates such as driver locations, dispatch notifications, and freight chat.

### Financial State Integrity

Escrow and wallet operations should preserve consistent financial state and prevent duplicate or unauthorized payouts.

### Media Optimization

Uploaded images are processed before storage to reduce payload size and improve application performance.

---

# License

This project is distributed under the **ISC License**.

See the project's license file for the complete license terms.

---

## Status

**DropIt** is a backend API for freight delivery, driver bidding, real-time tracking, KYC verification, payment processing, and escrow-based delivery workflows.
