# ⚙️ Gadgets POS & Inventory Management System — Backend API

A secure, modular, and robust RESTful API backend designed for retail mobile phone and gadget point-of-sale systems. Built with **Node.js**, **Express**, **TypeScript**, and **MongoDB (Mongoose)**.

---

## 🌟 Key Features

- **🔐 Authentication & Access Control:**
  - Secure JWT authentication with HTTP/Authorization Bearer tokens.
  - Role-Based Access Control (RBAC): **Owner**, **Admin**, and **Staff**.
  - Password hashing with `bcryptjs`.
- **📱 Phone & Device Inventory:**
  - Unique IMEI tracking with duplicate validation.
  - Brand and Model separation for accurate identification.
  - Lifecycle management: In-Stock, Sold, Transfer, and Warranty status.
- **🎧 Gadget & Accessories Inventory:**
  - Multi-quantity stock tracking, purchasing, and sales history.
- **💰 Capital, Partner Equity & Expenses:**
  - Capital investment and withdrawal ledger with partner ratio tracking.
  - Shop expense tracking categorized by Rent, Salary, Utilities, etc.
  - Automated business cash and profit calculation.
- **🏬 Multi-Shop Identity & Settings:**
  - Dynamic store profile management: Store Name, Logo, Contact, and Invoice Footer Notes.
- **⚡ High-Performance & Cloud-Ready:**
  - Built-in `/api/health` endpoint for instant Render/Cloud cold-start wake-up.
  - Helmet security headers and strict CORS whitelist protection.
  - Centralized asynchronous error handler with descriptive client responses.
  - Auto-seeding default administrative credentials on first run.

---

## 🛠️ Technology Stack

| Layer                | Technology                                                                                                                         |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**          | [Node.js](https://nodejs.org/) (ES Modules)                                                                                        |
| **Language**         | [TypeScript 5](https://www.typescriptlang.org/) (Strict Type Checking)                                                             |
| **Framework**        | [Express 4](https://expressjs.com/)                                                                                                |
| **Database**         | [MongoDB](https://www.mongodb.com/) via [Mongoose 8](https://mongoosejs.com/)                                                      |
| **Security**         | [Helmet](https://helmetjs.github.io/), [CORS](https://github.com/expressjs/cors), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Tokens & Auth**    | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)                                                                         |
| **Validation**       | [Zod](https://zod.dev/) Schema Validation                                                                                          |
| **Development Tool** | [tsx watch](https://github.com/privatenumber/tsx)                                                                                  |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- MongoDB instance (Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### 1. Installation

```bash
cd Phone-Bazar-Backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to create your local `.env` file:

```bash
cp .env.example .env
```

Configure your environment variables:

```env
# Server Port
PORT=5000
NODE_ENV=development

# MongoDB Connection String
MONGODB_URI=mongodb://127.0.0.1:27017/phone_pos_shop1

# JWT Security
JWT_SECRET=your-super-secret-jwt-key-min-24-characters
JWT_EXPIRES_IN=30d

# Allowed Frontend Origins (comma-separated)
CORS_ORIGIN=http://localhost:8080,http://localhost:5173,https://your-frontend.vercel.app

# Default Admin Auto-Seed (Optional)
AUTO_SEED_DEFAULT_ADMIN=true
DEFAULT_ADMIN_NAME=Shop Owner
DEFAULT_ADMIN_EMAIL=owner@shop.com
DEFAULT_ADMIN_PASSWORD=change_this_password123
```

### 3. Running Locally

Start in development mode with live reloading:

```bash
npm run dev
```

The server will start at **`http://localhost:5000`**.

### 4. Production Build & Execution

Compile TypeScript to JavaScript:

```bash
npm run build
```

Run the compiled production server:

```bash
npm start
```

---

## ☁️ Deployment Guide (Render)

1. Create a new **Web Service** on **[Render](https://render.com/)**.
2. Connect your Git repository and set the root directory to `Phone-Bazar-Backend`.
3. Configure the **Build & Start Commands**:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. In the **Environment Variables** section, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default assigned by Render)
   - `MONGODB_URI`: Your MongoDB Atlas connection URI
   - `JWT_SECRET`: A secure 32+ character random string
   - `CORS_ORIGIN`: Your production Vercel frontend URL
5. Click **Deploy**.

---

## 📡 API Endpoints Reference

### Health & Root

| Method | Endpoint      | Access | Description                   |
| :----- | :------------ | :----- | :---------------------------- |
| `GET`  | `/`           | Public | API Root status               |
| `GET`  | `/api/health` | Public | Render wake-up & health check |

### Authentication & Users

| Method   | Endpoint                      | Access        | Description                                   |
| :------- | :---------------------------- | :------------ | :-------------------------------------------- |
| `POST`   | `/api/auth/login`             | Public        | User authentication & JWT generation          |
| `GET`    | `/api/auth/me`                | Authenticated | Retrieve currently authenticated user profile |
| `POST`   | `/api/auth/forgot-password`   | Public        | Password reset request                        |
| `GET`    | `/api/admin/users`            | Admin / Owner | List all staff and administrative accounts    |
| `POST`   | `/api/admin/users`            | Admin / Owner | Create a new user account                     |
| `PATCH`  | `/api/admin/users/:id/role`   | Owner         | Update user role (owner, admin, staff)        |
| `PATCH`  | `/api/admin/users/:id/status` | Owner         | Enable or disable user access                 |
| `DELETE` | `/api/admin/users/:id`        | Owner         | Remove user account                           |

### Phones & Sales

| Method   | Endpoint          | Access        | Description                                  |
| :------- | :---------------- | :------------ | :------------------------------------------- |
| `GET`    | `/api/phones`     | Authenticated | List all inventory and sold phones           |
| `POST`   | `/api/phones`     | Admin / Owner | Add new phone stock to inventory             |
| `PUT`    | `/api/phones/:id` | Authenticated | Update phone stock or register customer sale |
| `DELETE` | `/api/phones/:id` | Admin / Owner | Delete a phone stock entry                   |

### Gadgets & Accessories

| Method   | Endpoint             | Access        | Description                        |
| :------- | :------------------- | :------------ | :--------------------------------- |
| `GET`    | `/api/gadgets`       | Authenticated | List all gadget inventory items    |
| `POST`   | `/api/gadgets`       | Admin / Owner | Add new gadget to stock            |
| `PUT`    | `/api/gadgets/:id`   | Admin / Owner | Update gadget details & pricing    |
| `DELETE` | `/api/gadgets/:id`   | Admin / Owner | Remove gadget from stock           |
| `GET`    | `/api/gadgets-sales` | Authenticated | List all gadget sales transactions |
| `POST`   | `/api/gadgets-sales` | Authenticated | Record a new gadget sale           |

### Partner Equity & Shop Expenses

| Method   | Endpoint                         | Access        | Description                              |
| :------- | :------------------------------- | :------------ | :--------------------------------------- |
| `GET`    | `/api/partners/transactions`     | Admin / Owner | List capital investments and withdrawals |
| `POST`   | `/api/partners/transactions`     | Admin / Owner | Record a capital transaction             |
| `DELETE` | `/api/partners/transactions/:id` | Owner         | Delete a capital entry                   |
| `GET`    | `/api/expenses`                  | Admin / Owner | List shop expenses                       |
| `POST`   | `/api/expenses`                  | Admin / Owner | Record a new expense                     |
| `DELETE` | `/api/expenses/:id`              | Owner         | Delete an expense entry                  |

### Business Profile

| Method | Endpoint                | Access        | Description                           |
| :----- | :---------------------- | :------------ | :------------------------------------ |
| `GET`  | `/api/business-profile` | Authenticated | Retrieve store branding and settings  |
| `POST` | `/api/business-profile` | Admin / Owner | Save store name, logo, and memo notes |

---

## 📁 Project Structure

```text
Phone-Bazar-Backend/
├── src/
│   ├── config/             # Database connection & environment validation
│   ├── controllers/        # Route controllers & business logic
│   ├── middlewares/        # Auth verify, role checks, global error handling
│   ├── models/             # Mongoose schemas (Phone, Gadget, User, Partner, Profile)
│   ├── routes/             # Express route routers
│   ├── services/           # Auto-seed admin, email & utility services
│   ├── app.ts              # Express application setup, security & middlewares
│   └── server.ts           # Server bootstrap & graceful shutdown
├── dist/                   # Compiled production JavaScript files
├── .env.example            # Environment template
├── package.json
└── tsconfig.json
```

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.
