# 📱 Phone Bazar POS & Inventory Management System — Frontend

A modern, high-performance Point of Sale (POS), Stock Management, and Business Ledger application designed specifically for retail mobile phone and gadget businesses. Built with **TanStack Start**, **React 19**, **TypeScript**, **Redux Toolkit**, and **Tailwind CSS v4**.

---

## 🌟 Key Features

- **🛒 Point of Sale (POS) & Billing:**
  - Fast sales wizard with automatic profit calculation.
  - Printable thermal invoice/memo generator with shop branding and custom invoice notes.
- **📦 Smart Inventory Management:**
  - Dedicated modules for **Mobile Phones** and **Gadgets & Accessories**.
  - Intelligent **Brand** and **Model** separation for clean, accurate device identification.
  - Unique **IMEI tracking**, color, specifications, and purchase/selling price history.
  - Dual view modes: Interactive **Card Grid** and dense **Table View**.
- **🛡️ Dynamic Warranty Tracking:**
  - Automated remaining days calculation from sale date.
  - Color-coded urgency badges: **Green** for active coverage (≥ 7 days) and **Red Alert** for expiring soon (< 7 days) or expired items.
  - Filter by IMEI, Product, or Customer name/phone.
- **👥 Customer Directory & CRM:**
  - Complete customer profile database with aggregate purchases and device history.
  - Searchable by customer name, phone number, IMEI, Brand, or Model.
- **💼 Owner Equity, Partner Ledger & Expenses:**
  - Capital investment & withdrawal tracking per partner/owner.
  - **Privacy Blur & Eye Toggle:** Total invested capital is blurred by default for counter privacy and can be revealed with a single click.
  - **3D Expense Growth Trend Chart:** Visual bar analytics comparing monthly expenditure.
  - **Dividend Profit Share:** Real-time profit distribution calculator (Equal split or Capital ratio).
- **🔐 User & Role-Based Access Control:**
  - Role management: **Owner / Admin** (master controls) and **Staff** (counter sales & stock lookup).
  - Modern gradient stat cards showing total, admin, staff, and live active users.
- **⚡ Supercharged Cloud Performance:**
  - **Render Cold-Start Preventer:** Automatically pings backend health on app boot to ensure backend wakes up before user navigates.
  - **Identical Twin Shimmer Skeletons:** Zero Cumulative Layout Shift (CLS = 0) while data is loading.
  - **Universal 10-Item Pagination:** All lists and tables render exactly 10 records per page for smooth responsiveness.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [TanStack Start](https://tanstack.com/start) & [Vite](https://vitejs.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **UI Library** | [React 19](https://react.dev/) |
| **State Management** | [Redux Toolkit](https://redux-toolkit.js.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/) primitives |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Charts & Graphs** | [Recharts](https://recharts.org/) |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm, pnpm, or bun

### 1. Installation
```bash
cd Phone-Bazar-Frontend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (or copy `.env.example`):
```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api
```

### 3. Running Locally
Start the development server:
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:8080`** (or the port specified in terminal output).

### 4. Production Build & Preview
To create an optimized production bundle:
```bash
npm run build
```
To preview the production build locally:
```bash
npm run preview
```

---

## ☁️ Deployment Guide (Vercel)

1. Connect your repository to **[Vercel](https://vercel.com/)**.
2. Set the project root to `Phone-Bazar-Frontend`.
3. Configure the **Build Settings**:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.output/public`
4. Add the **Environment Variable**:
   - `VITE_API_URL`: Your live backend API URL (e.g. `https://your-api.onrender.com/api`)
5. Click **Deploy**.

---

## 📁 Project Structure

```text
Phone-Bazar-Frontend/
├── public/                 # Static assets & shop logos
├── src/
│   ├── components/         # Modular reusable UI components
│   │   ├── gadget/         # Gadget inventory & sales sections
│   │   ├── partner/        # Partner ledger, modals & overview charts
│   │   ├── sales/          # POS wizard, stock modals & table components
│   │   ├── settings/       # Shop brand customization modals
│   │   ├── stocks/         # Phone cards, detail slideover & table views
│   │   └── ui/             # StatCard, StatCardSkeleton, Pagination, Buttons
│   ├── lib/                # Utilities, stores, formatting & UI helpers
│   ├── routes/             # File-based routing (TanStack Router)
│   │   ├── __root.tsx      # App shell, auth hydration & warmup ping
│   │   ├── dashboard.tsx   # Main analytics & business summary
│   │   ├── all-stocks.tsx  # Master phone stock & sales history
│   │   ├── gadget.tsx      # Accessory & gadget inventory
│   │   ├── customers.tsx   # Customer directory & CRM
│   │   ├── warranty.tsx    # Warranty tracker
│   │   ├── partner.tsx     # Partner ledger & expense manager
│   │   ├── user-management.tsx # Staff & team accounts
│   │   └── login.tsx       # Authentication
│   ├── store/              # Redux slices (auth, sales, gadgets, partner, users)
│   └── styles.css          # Global CSS tokens & shimmer animations
├── package.json
└── vite.config.ts
```

---

## 📄 License
This project is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.
