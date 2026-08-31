# 🚕 Ride-Hailing, Driver Verification & Payment Gateway Engine

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%20v8-green.svg)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Security: JWT](https://img.shields.io/badge/Auth-JWT%20Bearer-red.svg)](https://jwt.io/)

A production-grade, highly secure RESTful API backend engineered for a multi-role ride-hailing platform. Built with **Node.js, Express.js, and MongoDB**, this system orchestrates real-time ride request lifecycles, atomic driver KYC verification workflows, stateful multi-step payment tracking, and an AWS-backed transactional OTP engine for account recovery.

---

## 🌟 Key Platform Capabilities

### 🔐 Multi-Role Authentication & Access Control (RBAC)
* **Stateless Authorization:** Secure JWT issuance and verification middleware.
* **Role-Based Workflows:** Strict privilege separation between **Passengers** and **Drivers**.
* **Mass-Assignment Guard:** Explicit object payloads across all endpoints prevent parameter pollution and field-injection exploits.

### 📧 Transactional Email & OTP Recovery System
* **AWS SES & Nodemailer Integration:** Enterprise-grade email delivery for security notifications.
* **Cryptographic 6-Digit OTP:** Expiration-tracked password reset workflow designed to mitigate brute-force and replay attacks.

### 🚗 End-to-End Trip Management Engine
* **Complete Lifecycle Support:** Seamless transition through `pending`, `accepted`, `in-transit`, `completed`, and `cancelled` states.
* **Data Scoping:** Users and drivers can only query or mutate their active, authorized request records (`req.user.id`).

### 🪪 Driver KYC Compliance & Verification
* **Atomic Document Submissions:** Document intake supporting driver license and vehicle bluebook tracking.
* **Upsert Architecture:** Prevents database bloat and duplicate submissions using MongoDB `findOneAndUpdate` upserts.

### 💳 Stateful Payment & Transaction Tracking
* **Multi-Status Processing:** Explicit tracking across `pending`, `completed`, and `failed` order states.
* **Audit-Ready Records:** Immutable transaction logs linking `userId`, `orderId`, and `merchantId` for post-settlement reconciliation.

---

## 🛠️ Architecture & Tech Stack

```text
┌─────────────────────────────────────────────────────────┐
│                       Client Layer                      │
│            (Mobile App / Web Frontend / Postman)        │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS / Bearer Token
┌────────────────────────────▼────────────────────────────┘
│                     Express API Gateway                 │
│         [Middlewares: Auth (JWT), Validator, Router]     │
└──────┬──────────────────┬──────────────────┬────────────┘
       │                  │                  │
┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
│ Auth & Users│    │ Trips & KYC │    │   Payments  │
│   Services  │    │   Services  │    │   Services  │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
┌──────▼──────────────────▼──────────────────▼────────────┐
│               Data Access Layer (Mongoose)              │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┘
│                     MongoDB Database                    │
└─────────────────────────────────────────────────────────┘


Runtime Environment: Node.js (ES6+ ESM syntax)Web Framework: Express.jsDatabase & ODM: MongoDB with Mongoose ORMAuthentication: JSON Web Tokens (jsonwebtoken) & bcryptjs password hashingCloud Services: AWS SES (Simple Email Service)📂 Project Directory StructurePlaintextsrc/
 ├── config/            # DB connection, AWS SDK & environment configs
 ├── middlewares/       # Auth verification & centralized error handling
 ├── models/            # Mongoose schemas (User, Request, Kyc, Payment)
 ├── routes/            # Express endpoint routers
 │    ├── auth.route.js     # Password reset & OTP endpoints
 │    ├── kyc.route.js      # Driver verification endpoints
 │    ├── pay.route.js      # Payment processing endpoints
 │    ├── request.route.js  # Trip lifecycle endpoints
 │    └── user.route.js     # Identity & profile endpoints
 ├── services/          # Core business logic & database layer
 └── app.js             # Server entry point & global middleware stack
📡 Complete API ReferenceAll protected endpoints require an Authorization: Bearer <JWT_TOKEN> header.1️⃣ Authentication (/api/users & /api/auth)MethodEndpointAccessDescriptionPOST/api/users/registerPublicRegister new passenger or driver accountPOST/api/users/loginPublicAuthenticate user & receive JWT tokenPOST/api/auth/forgot-passwordPublicTrigger 6-digit OTP email via AWS SESPOST/api/auth/reset-passwordPublicVerify OTP and set a new password2️⃣ Trip Management (/api/requests)MethodEndpointAccessDescriptionPOST/api/requestsProtectedCreate a new ride requestGET/api/requests/myProtectedRetrieve active & past trip history for userGET/api/requests/:idProtectedFetch specific request details by IDPUT/api/requests/:idProtectedUpdate request state (e.g., driver accept/complete)DELETE/api/requests/:idProtectedCancel/Delete a ride request3️⃣ Driver KYC Verification (/api/kyc)MethodEndpointAccessDescriptionPOST/api/kycProtectedSubmit or update driver license & bluebook docsGET/api/kyc/myProtectedFetch current driver's verification status4️⃣ Payment Processing (/api/payments)MethodEndpointAccessDescriptionPOST/api/paymentsProtectedInitialize transaction (pending state)GET/api/payments/myProtectedFetch payment transaction history for userGET/api/payments/:idProtectedFetch single payment details by IDPUT/api/payments/:id/statusProtectedUpdate payment status (completed / failed)🛡️ Security & Enterprise Best PracticesContext-Bound Identity: Users cannot forge payloads on behalf of others; identity is strictly extracted server-side via req.user.id.Atomic Updates & Upserts: Prevents race conditions during document verification updates using findOneAndUpdate with upsert: true.Defense-in-Depth Validation: Rejects malformed requests at the boundary before triggering database ops.Environment Isolation: Zero credentials or API keys exposed; managed through strict .env configurations.🚀 Getting StartedPrerequisitesNode.js: v18.x or higherMongoDB: Instance running locally or via MongoDB AtlasAWS SES Account (Optional): Required for live email functionalityInstallationClone the repository:Bashgit clone [https://github.com/yourusername/ride-hailing-backend.git](https://github.com/yourusername/ride-hailing-backend.git)
cd ride-hailing-backend
Install dependencies:Bashnpm install
Configure Environment Variables:Create a .env file in the root directory:Code snippetPORT=8000
MONGO_URI=mongodb+srv://<db_user>:<db_password>@cluster.mongodb.net/ride_hailing_db
JWT_SECRET=your_super_secret_jwt_key_here
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
SENDER_EMAIL=noreply@yourdomain.com
Launch the Application:Bash# Development mode (Nodemon auto-reload)
npm run dev

# Production mode
npm start
🧪 TestingThe API can be tested using Postman or Insomnia. Ensure you set the Bearer Token in the Authorization tab after calling POST /api/users/login.📄 LicenseDistributed under the MIT License. See LICENSE for more information.