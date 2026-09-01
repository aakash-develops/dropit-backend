# 🚚 DropIt (Bhariya) — Freight & Logistics Backend

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.18-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_v8-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.IO-v4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> **A production-ready, real-time freight marketplace and escrow payment engine.** Designed to bridge the gap between shippers and drivers, this system manages complex workflows including dynamic pricing, turn-based bidding, real-time GPS tracking, and secure two-factor escrow releases.

---

## 📖 Table of Contents

- [Overview & Mission](#-overview--mission)
- [Why This Project Stands Out](#-why-this-project-stands-out)
- [Core Business Logic & Features](#-core-business-logic--features)
- [System Architecture](#-system-architecture)
- [Technical Highlights](#-technical-highlights)
- [API & Event Reference](#-api--event-reference)
- [Getting Started (Local Setup)](#-getting-started-local-setup)
- [Why This Architecture?](#-why-this-architecture)
- [License](#-license)

---

## 🌟 Overview & Mission

**DropIt** is the backend backbone for a modern freight delivery platform. It moves beyond simple ride-hailing by implementing a robust **escrow-based marketplace**. Shippers can post loads, drivers can bid on them, and the platform securely holds funds until the job is verified as complete.

This project demonstrates mastery in building complex, real-time, event-driven microservices with a focus on security, financial integrity, and seamless user experience.

---

## 🏆 Why This Project Stands Out

This isn't just a CRUD API. It solves real-world logistical and financial challenges:

- **Dynamic Floor Pricing:** Prevents "race-to-the-bottom" pricing by calculating minimum viable rates based on distance, weight, and vehicle type.
- **Secure Escrow & 2FA Handshake:** Implements a two-step OTP verification (Pickup & Delivery) to automatically release payments only after physical proof of delivery (POD) is submitted.
- **Real-Time Collaboration:** Uses Socket.IO to provide live location tracking, instant chat, and real-time bidding updates, mimicking the responsiveness of a modern fintech app.
- **KYC & Driver Verification:** Features a complete, admin-reviewable driver onboarding pipeline, including document upload and image compression.

---

## ⚙️ Core Business Logic & Features

### 🚛 Dynamic Price Estimation
The `estimatePrice` engine protects driver earnings by factoring in vehicle type, distance, and load weight, preventing underpriced trips.

### 🤝 Turn-Based Bidding Engine
A structured negotiation process capped at 2 rounds per driver. It enforces strict turn-taking, auto-generates OTPs upon acceptance, and locks rates.

### 🔐 Escrow & Two-Factor OTP Handshake
- **Escrow Lock:** Funds are held from the shipper upon acceptance.
- **Pickup OTP:** Driver verifies they have picked up the load.
- **Delivery OTP & POD:** Driver uploads a Proof of Delivery photo.
- **Atomic Settlement:** Platform takes a 10% commission and immediately sends 90% to the driver's wallet.

### 📡 Real-Time GPS & Communication
- **Live Tracking:** Socket.IO broadcasts driver coordinates to shippers in real-time.
- **Instant Dispatches:** Notifies nearby drivers of new loads immediately.
- **In-App Chat:** Dispute-monitored chat for load-specific communication.

### 🪪 KYC Driver Onboarding
A multi-step verification pipeline:
- **Upload:** License, Selfie, and Vehicle Bluebook documents.
- **Processing:** Images are compressed and converted to WebP.
- **Admin Review:** Administrative states (`approved`, `rejected`, `action_required`).

### 💳 Integrated Payment Gateway
Native integration with Paytrail for online payments, paired with a driver wallet system tracking `pending escrow` vs. `available earnings`.

---

## 🧩 System Architecture

```mermaid
flowchart LR
    Client["Client (Mobile/Web)"] -->|"HTTP / JWT"| API["Express.js Route Layer"]
    Client -->|WebSocket| Socket["Socket.IO Engine"]

    subgraph Backend ["DropIt Backend"]
        API --> Services["Services & Logic"]
        Services --> DB[("MongoDB Database")]
        Services --> Queue["Queue Jobs (Email / Notifications)"]

        API --> Upload["Multer + Sharp"]
        Upload --> FS["Local Storage / Cloud"]

        Socket --> Services
    end

    Services --> Paytrail["Paytrail Gateway"]
    Services --> Redis["Redis (Rate Limiting / Caching)"]

    style Backend fill:#f9f9f9,stroke:#333,stroke-width:2px
🔥 Technical Highlights
Secure Authentication: JWT-based authentication with role-based access control (Shipper/Driver/Admin).

In-Memory Image Processing: Multer for multipart uploads and Sharp for high-performance WebP compression.

Real-Time Data: Full-duplex communication via WebSockets for location and chat.

Geospatial Queries: MongoDB's GeoJSON integration for finding nearby loads and tracking routes.

Atomic Transactions: Ensures data integrity during escrow settlements and wallet updates.

Email Integration: Uses Resend API for transactional emails (OTPs, status updates).

📡 API & Event Reference
All protected endpoints require the HTTP Header: Authorization: Bearer <JWT_TOKEN>.

Freight Requests (/api/requests)
Method	Endpoint	Description
POST	/estimate-price	Calculate minimum rate estimate.
POST	/	Create a new freight request (enforces floor price).
GET	/my	List requests created by the authenticated shipper.
GET	/nearby	Find open loads near geospatial coordinates.
GET	/driver-trips	Fetch active trips assigned to the logged-in driver.
GET	/feed	View the global active load feed.
GET	/:id	Get details for a specific freight request.
PUT	/:id/accept	Directly accept a trip request at the current price.
POST	/:id/pod	Upload Proof of Delivery cargo photo.
POST	/:id/verify-otp	Verify pickup or delivery OTPs to release escrow.
Bidding & Negotiations (/api/bids)
Method	Endpoint	Description
POST	/	Submit a new offer or counter-offer.
GET	/request/:requestId	Fetch chronologically sorted bid history.
PUT	/:bidId/accept	Accept offer, lock rate, and generate verification OTPs.
Driver Identity Verification (/api/kyc)
Method	Endpoint	Description
POST	/	Upload license, selfie, and vehicle bluebook documents.
GET	/	Check current verification status.
PUT	/:kycId/status	Admin route to approve, reject, or request revisions.
Payments & Wallet (/api/payments)
Method	Endpoint	Description
POST	/paytrail/create	Request a Paytrail checkout transaction session.
GET	/wallet/driver	Get driver earnings, pending escrow, and balance.
ALL	/paytrail/callback	Paytrail payment notification webhook listener.
Real-Time Events (Socket.IO)
Connect via WebSockets to listen and send freight coordination events:

Event Name	Direction	Purpose
join_freight_room	Client → Server	Subscribe to updates for a specific load.
update_driver_location	Driver → Server	Broadcast driver GPS updates.
driver_location_updated	Server → Room	Send location to subscribers tracking the shipment.
broadcast_new_freight	Client → Server	Alert nearby drivers of new loads.
send_freight_message	Client → Server	Deliver in-app trip chat messages.
🚀 Getting Started (Local Setup)
Prerequisites
Node.js (v18+)

MongoDB (Local or Atlas)

Installation
Clone the repository

bash
git clone https://github.com/aakash-develops/dropit-backend.git
cd dropit-backend
Install dependencies

bash
npm install
Configure Environment Variables
Create a .env file in the root directory:

env
PORT=5000
MONGO_URL=mongodb://localhost:27017/dropit
JWT_SECRET=your_jwt_secret_key
RESEND_API_KEY=re_your_resend_api_key
Run the development server

bash
npm run dev
The server will start at http://localhost:5000.

🤔 Why This Architecture?
The architecture was designed for scalability, maintainability, and financial accuracy.

Service Layer Abstraction: Business logic is separated from controllers, making it easy to test and swap out components (e.g., changing payment providers).

Event-Driven Communication: WebSockets are not just for chat; they are a primary channel for critical logistics data (location, bids), reducing API polling overhead.

Atomic Operations: Financial transactions (escrow lock, commission, payout) are performed atomically to prevent data corruption or double-spending.

Stateless API: Using JWT for authentication allows the API to scale horizontally across multiple instances without sticky sessions.

📄 License
Distributed under the ISC License. See LICENSE for more information.

🤝 Author & Contact
Aakash Basnet
https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white
https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white

Feel free to open an issue or submit a pull request for any enhancements!

text

---

**Just click the "Copy" button** that appears in the top-right corner of the gray box above (if you're on desktop), or manually select all the text inside that gray box, copy it, and paste it into your `README.md` file. 

When you push this to GitHub, it will render perfectly as a styled webpage, with the diagram, tables, and badges all working correctly! 🚀
This response is AI-generated, for reference only.
yeah but technical highlights api references every thing is out of this brown box
We need to figure out why the user sees the content as "out of the box". Possibly the user is viewing the message on a platform where the code block is not correctly formatted, or they are confused because the copy-paste includes the outer code block markers. The user says "technical highlights api references every thing is out of this brown box" – probably they are saying that after they paste into README, the sections look like plain text not inside a code block? Actually the README is not supposed to be inside a code block on GitHub; it's the whole file. The "brown box" might refer to the code block in the chat. They want everything inside a single code block for copying, but they said "out of this brown box" meaning maybe they copied only part? Or they think the rendered README should have a brown box? I think the user is confused because they see the text outside the code fences in my previous responses. I should provide a clean copy with just the raw markdown inside triple backticks, and maybe explain that once they paste it into README.md and save, GitHub renders it without boxes. I'll give the final answer with the entire markdown inside a code block, and emphasize that this is the content to paste, and after pushing, it will look like a proper webpage. I'll also ensure the code block is properly closed. Let's just give the full code block again.

Ah, I think I finally understand! 😅

You're saying that when you look at my message, the "Technical Highlights" and "API Reference" sections are outside the gray code block (the "brown box" you mentioned). That's because those sections are literally not inside the code block — I mistakenly put the closing triple backticks too early in some of my previous responses.

Let me fix this once and for all. Here is the entire README content — from the very first # to the last --- — inside a single code block, with no extra text outside it.

👇 Copy the entire content of this code block. Do not copy anything before or after the triple backticks.

markdown
# 🚚 DropIt (Bhariya) — Freight & Logistics Backend

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.18-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_v8-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.IO-v4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> **A production-ready, real-time freight marketplace and escrow payment engine.** Designed to bridge the gap between shippers and drivers, this system manages complex workflows including dynamic pricing, turn-based bidding, real-time GPS tracking, and secure two-factor escrow releases.

---

## 📖 Table of Contents

- [Overview & Mission](#-overview--mission)
- [Why This Project Stands Out](#-why-this-project-stands-out)
- [Core Business Logic & Features](#-core-business-logic--features)
- [System Architecture](#-system-architecture)
- [Technical Highlights](#-technical-highlights)
- [API & Event Reference](#-api--event-reference)
- [Getting Started (Local Setup)](#-getting-started-local-setup)
- [Why This Architecture?](#-why-this-architecture)
- [License](#-license)

---

## 🌟 Overview & Mission

**DropIt** is the backend backbone for a modern freight delivery platform. It moves beyond simple ride-hailing by implementing a robust **escrow-based marketplace**. Shippers can post loads, drivers can bid on them, and the platform securely holds funds until the job is verified as complete.

This project demonstrates mastery in building complex, real-time, event-driven microservices with a focus on security, financial integrity, and seamless user experience.

---

## 🏆 Why This Project Stands Out

This isn't just a CRUD API. It solves real-world logistical and financial challenges:

- **Dynamic Floor Pricing:** Prevents "race-to-the-bottom" pricing by calculating minimum viable rates based on distance, weight, and vehicle type.
- **Secure Escrow & 2FA Handshake:** Implements a two-step OTP verification (Pickup & Delivery) to automatically release payments only after physical proof of delivery (POD) is submitted.
- **Real-Time Collaboration:** Uses Socket.IO to provide live location tracking, instant chat, and real-time bidding updates, mimicking the responsiveness of a modern fintech app.
- **KYC & Driver Verification:** Features a complete, admin-reviewable driver onboarding pipeline, including document upload and image compression.

---

## ⚙️ Core Business Logic & Features

### 🚛 Dynamic Price Estimation
The `estimatePrice` engine protects driver earnings by factoring in vehicle type, distance, and load weight, preventing underpriced trips.

### 🤝 Turn-Based Bidding Engine
A structured negotiation process capped at 2 rounds per driver. It enforces strict turn-taking, auto-generates OTPs upon acceptance, and locks rates.

### 🔐 Escrow & Two-Factor OTP Handshake
- **Escrow Lock:** Funds are held from the shipper upon acceptance.
- **Pickup OTP:** Driver verifies they have picked up the load.
- **Delivery OTP & POD:** Driver uploads a Proof of Delivery photo.
- **Atomic Settlement:** Platform takes a 10% commission and immediately sends 90% to the driver's wallet.

### 📡 Real-Time GPS & Communication
- **Live Tracking:** Socket.IO broadcasts driver coordinates to shippers in real-time.
- **Instant Dispatches:** Notifies nearby drivers of new loads immediately.
- **In-App Chat:** Dispute-monitored chat for load-specific communication.

### 🪪 KYC Driver Onboarding
A multi-step verification pipeline:
- **Upload:** License, Selfie, and Vehicle Bluebook documents.
- **Processing:** Images are compressed and converted to WebP.
- **Admin Review:** Administrative states (`approved`, `rejected`, `action_required`).

### 💳 Integrated Payment Gateway
Native integration with Paytrail for online payments, paired with a driver wallet system tracking `pending escrow` vs. `available earnings`.

---

## 🧩 System Architecture

```mermaid
flowchart LR
    Client["Client (Mobile/Web)"] -->|"HTTP / JWT"| API["Express.js Route Layer"]
    Client -->|WebSocket| Socket["Socket.IO Engine"]

    subgraph Backend ["DropIt Backend"]
        API --> Services["Services & Logic"]
        Services --> DB[("MongoDB Database")]
        Services --> Queue["Queue Jobs (Email / Notifications)"]

        API --> Upload["Multer + Sharp"]
        Upload --> FS["Local Storage / Cloud"]

        Socket --> Services
    end

    Services --> Paytrail["Paytrail Gateway"]
    Services --> Redis["Redis (Rate Limiting / Caching)"]

    style Backend fill:#f9f9f9,stroke:#333,stroke-width:2px
🔥 Technical Highlights
Secure Authentication: JWT-based authentication with role-based access control (Shipper/Driver/Admin).

In-Memory Image Processing: Multer for multipart uploads and Sharp for high-performance WebP compression.

Real-Time Data: Full-duplex communication via WebSockets for location and chat.

Geospatial Queries: MongoDB's GeoJSON integration for finding nearby loads and tracking routes.

Atomic Transactions: Ensures data integrity during escrow settlements and wallet updates.

Email Integration: Uses Resend API for transactional emails (OTPs, status updates).

📡 API & Event Reference
All protected endpoints require the HTTP Header: Authorization: Bearer <JWT_TOKEN>.

Freight Requests (/api/requests)
Method	Endpoint	Description
POST	/estimate-price	Calculate minimum rate estimate.
POST	/	Create a new freight request (enforces floor price).
GET	/my	List requests created by the authenticated shipper.
GET	/nearby	Find open loads near geospatial coordinates.
GET	/driver-trips	Fetch active trips assigned to the logged-in driver.
GET	/feed	View the global active load feed.
GET	/:id	Get details for a specific freight request.
PUT	/:id/accept	Directly accept a trip request at the current price.
POST	/:id/pod	Upload Proof of Delivery cargo photo.
POST	/:id/verify-otp	Verify pickup or delivery OTPs to release escrow.
Bidding & Negotiations (/api/bids)
Method	Endpoint	Description
POST	/	Submit a new offer or counter-offer.
GET	/request/:requestId	Fetch chronologically sorted bid history.
PUT	/:bidId/accept	Accept offer, lock rate, and generate verification OTPs.
Driver Identity Verification (/api/kyc)
Method	Endpoint	Description
POST	/	Upload license, selfie, and vehicle bluebook documents.
GET	/	Check current verification status.
PUT	/:kycId/status	Admin route to approve, reject, or request revisions.
Payments & Wallet (/api/payments)
Method	Endpoint	Description
POST	/paytrail/create	Request a Paytrail checkout transaction session.
GET	/wallet/driver	Get driver earnings, pending escrow, and balance.
ALL	/paytrail/callback	Paytrail payment notification webhook listener.
Real-Time Events (Socket.IO)
Connect via WebSockets to listen and send freight coordination events:

Event Name	Direction	Purpose
join_freight_room	Client → Server	Subscribe to updates for a specific load.
update_driver_location	Driver → Server	Broadcast driver GPS updates.
driver_location_updated	Server → Room	Send location to subscribers tracking the shipment.
broadcast_new_freight	Client → Server	Alert nearby drivers of new loads.
send_freight_message	Client → Server	Deliver in-app trip chat messages.
🚀 Getting Started (Local Setup)
Prerequisites
Node.js (v18+)

MongoDB (Local or Atlas)

Installation
Clone the repository

bash
git clone https://github.com/aakash-develops/dropit-backend.git
cd dropit-backend
Install dependencies

bash
npm install
Configure Environment Variables
Create a .env file in the root directory:

env
PORT=5000
MONGO_URL=mongodb://localhost:27017/dropit
JWT_SECRET=your_jwt_secret_key
RESEND_API_KEY=re_your_resend_api_key
Run the development server

bash
npm run dev
The server will start at http://localhost:5000.

🤔 Why This Architecture?
The architecture was designed for scalability, maintainability, and financial accuracy.

Service Layer Abstraction: Business logic is separated from controllers, making it easy to test and swap out components (e.g., changing payment providers).

Event-Driven Communication: WebSockets are not just for chat; they are a primary channel for critical logistics data (location, bids), reducing API polling overhead.

Atomic Operations: Financial transactions (escrow lock, commission, payout) are performed atomically to prevent data corruption or double-spending.

Stateless API: Using JWT for authentication allows the API to scale horizontally across multiple instances without sticky sessions.

📄 License
Distributed under the ISC License. See LICENSE for more information.

🤝 Author & Contact
Aakash Basnet
https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white
https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white

Feel free to open an issue or submit a pull request for any enhancements!

text

---
