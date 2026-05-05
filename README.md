# ⚖ Court-Kacheri

### AI-Powered Legal Practice Management System

A full-stack legal management platform that streamlines case handling, client communication, billing, and document intelligence for law firms. Built with React, Node.js, and MongoDB.

---

<div align="center">

**[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Architecture](#-architecture) · [API Docs](#-api-documentation) · [Screenshots](#-screenshots)**

</div>

---

## ✨ Features

### 🏛️ Multi-Role Dashboard System
- **Firm Admin** — Full control over cases, clients, billing, team, and analytics
- **Lawyer** — Personal case load, time tracking, deadlines, and chat
- **Client** — Discover lawyers, request meetings, chat securely, view case updates
- **Super Admin** — Platform-wide user management, flag/ban accounts

### 🤖 AI Document Intelligence
- Upload legal documents (PDF) and get instant AI-powered analysis
- Extracts key clauses, risk factors, and case summaries using **Google Gemini AI**
- Smart document tagging and categorization

### 💬 Real-Time Secure Chat
- End-to-end real-time messaging between clients and lawyers via **Socket.IO**
- Individual message deletion (both sides)
- Full chat history clearing
- Unread message notifications with pulsing badges
- Chat session management — delete sessions to reset connections

### 📊 Case & Practice Management
- Auto-generated case numbers (`CK-2026-0001`)
- Case lifecycle tracking (open → closed)
- Assign multiple lawyers to a case
- Document uploads with case linking
- Deadline management with **conflict detection** (±1 hour overlap warnings)

### ⏱️ Time Tracking & Billing
- Live timer with start/stop functionality (one active timer per user)
- Billable vs non-billable hour tracking
- Auto-generated invoices from time entries
- Invoice lifecycle management (draft → sent → paid → overdue)
- Revenue analytics and summaries

### 🔐 Authentication & Security
- JWT-based authentication with role-based access control
- **Google OAuth** sign-in/sign-up integration
- Rate limiting on auth endpoints (brute-force protection)
- Helmet security headers
- Input validation on all routes

### 🎨 Premium UI/UX
- Dark-themed, modern interface with gold accent palette
- **3D Interactive Lady Justice** model on the landing page (Three.js)
- Smooth animations with Framer Motion
- Fully responsive across all devices
- Custom typography (Playfair Display + Inter)

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI Framework |
| Redux Toolkit | State Management |
| React Router v6 | Routing |
| Tailwind CSS 4 | Styling |
| Framer Motion | Animations |
| Three.js / React Three Fiber | 3D Graphics |
| Socket.IO Client | Real-time Communication |
| Recharts | Data Visualization |
| Lucide React | Icons |
| @react-oauth/google | Google Sign-In |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API Server |
| MongoDB + Mongoose | Database & ODM |
| Socket.IO | WebSocket Server |
| JWT (jsonwebtoken) | Authentication |
| Google Auth Library | OAuth Token Verification |
| Google Generative AI | Document Analysis (Gemini) |
| Multer | File Uploads |
| Winston | Logging |
| Helmet + Rate Limiter | Security |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (Atlas or local)
- **Google Cloud** OAuth Client ID ([setup guide](#google-oauth-setup))
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/court-kacheri.git
cd court-kacheri
```

**Backend Setup:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

**Frontend Setup:**
```bash
cd client
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### Environment Variables

**`server/.env`**
```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
CORS_ORIGIN=*
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a project → Configure OAuth Consent Screen
3. Create **OAuth 2.0 Client ID** (Web Application)
4. Add `http://localhost:3000` as an authorized JavaScript origin
5. Copy the Client ID to both `.env` files

---

## 🏗️ Architecture

```
court-kacheri/
├── server/                    # Express.js Backend
│   ├── config/                # DB connection, Socket.IO, logger
│   ├── controllers/           # Route handlers
│   │   ├── authController.js
│   │   ├── googleAuth.js
│   │   ├── caseController.js
│   │   ├── clientController.js
│   │   ├── billingController.js
│   │   ├── documentController.js
│   │   ├── documentAnalysisController.js
│   │   ├── deadlineController.js
│   │   ├── timeEntryController.js
│   │   ├── meetingController.js
│   │   ├── firmController.js
│   │   ├── publicController.js
│   │   └── superAdminController.js
│   ├── middleware/             # Auth, validation, error handling
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express route definitions
│   ├── utils/                 # Helpers, AI analyzer
│   └── server.js              # Entry point
│
└── client/                    # React Frontend
    └── src/
        ├── api/               # Axios instance
        ├── components/        # Reusable UI components
        │   ├── ui/            # Button, Card, Badge, Input, etc.
        │   ├── charts/        # Recharts visualizations
        │   ├── landing/       # Landing page sections
        │   ├── 3d/            # Three.js 3D components
        │   └── dashboard/     # Dashboard-specific components
        ├── hooks/             # Custom React hooks
        ├── pages/             # Page-level components
        │   ├── auth/          # Login, Register
        │   ├── dashboard/     # Admin, Lawyer, Client dashboards
        │   ├── cases/         # Case management + AI analysis
        │   ├── chat/          # Real-time messaging
        │   ├── billing/       # Invoice management
        │   ├── deadlines/     # Deadline tracking
        │   └── landing/       # Public landing page
        └── store/             # Redux Toolkit slices
```

---

## 📡 API Documentation

Full API documentation with request/response examples is available in [`server/API_DOCS.md`](server/API_DOCS.md).

### Key Endpoints

| Module | Endpoints | Auth |
|--------|-----------|------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `GET /auth/me` | Public / Private |
| **Cases** | Full CRUD + lawyer assignment | Firm Members |
| **Clients** | Full CRUD with search & pagination | Firm Members |
| **Documents** | Upload, list, delete + AI analysis | Firm Members |
| **Deadlines** | CRUD + conflict detection | Firm Members |
| **Time Entries** | Start/stop timer, summaries | Firm Members |
| **Billing** | Invoice CRUD, auto-generation, revenue summary | Admin |
| **Meetings** | Request, accept/reject, chat, delete | Client / Lawyer |
| **Firms** | Create, manage, invite lawyers | Admin |

---

## 📸 Screenshots

> Add your screenshots here after deployment!

| Landing Page | Dashboard | Chat |
|---|---|---|
| *3D Hero Section* | *Admin Analytics* | *Secure Messaging* |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

<div align="center">

**Built with ❤️ for the Indian Legal System By Rishi**

⚖ *Justice, simplified.*

</div>
