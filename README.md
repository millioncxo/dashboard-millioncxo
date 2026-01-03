# MillionCXO Dashboard

A complete CRM-style dashboard module for managing clients, services, reports, and user interactions for MillionCXO.

## 🚀 Overview

This is a Next.js 14 application that provides a comprehensive backend API and UI for a multi-role CRM dashboard. It operates independently and can be deployed to `dashboard.millioncxo.com`.

### Key Features

- **Multi-role Authentication**: JWT-based auth with three roles (ADMIN, SDR, CLIENT)
- **Client Management**: Complete CRUD operations for clients, plans, and licenses
- **SDR Assignment System**: Assign SDRs to clients with specific service licenses
- **Reporting System**: Create and view weekly, monthly, and quarterly reports
- **Billing & Invoicing**: Track invoices, payments, and client credits
- **Contract Management**: Store and retrieve client contracts
- **Future Chat System**: Message model and placeholder APIs ready for implementation

## 📋 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: MongoDB Atlas (via Mongoose)
- **Authentication**: JWT with HttpOnly cookies
- **Password Hashing**: bcryptjs
- **API**: Next.js Route Handlers

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/millioncxo/dashboard-millioncxo.git
   cd dashboard-millioncxo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   
   Create a `.env` file based on `env.example`:
   ```bash
   cp env.example .env
   ```

   Edit `.env` and add your credentials:
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/millioncxo-dashboard?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   NODE_ENV=development
   ```

   **Important**: 
   - Replace `MONGODB_URI` with your actual MongoDB connection string
   - Generate a secure random string for `JWT_SECRET` (use: `openssl rand -base64 32`)

4. **Run the development server**:
   ```bash
   npm run dev
   ```

   The dashboard will be available at: http://localhost:3001

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## 🔐 Authentication System

### Overview

The dashboard uses JWT (JSON Web Tokens) stored in HttpOnly cookies for secure authentication.

### User Roles

1. **ADMIN**
   - Create and manage users
   - Create and manage clients
   - Assign SDRs to clients
   - View all system data

2. **SDR** (Sales Development Representative)
   - View assigned clients
   - Create reports for clients
   - Track activities and metrics
   - (Future) Message assigned clients

3. **CLIENT**
   - View own dashboard
   - Access reports, billing, and contracts
   - View plan details and credits
   - (Future) Message assigned SDR

### Authentication Flow

1. User submits credentials to `POST /api/auth/login`
2. Server verifies credentials against database
3. If valid, JWT is signed with user info (userId, role, clientId)
4. JWT stored in HttpOnly cookie named `dashboard_token`
5. Subsequent requests include cookie automatically
6. Protected routes verify JWT and check role permissions

### Auth Utilities

Located in `src/lib/auth.ts`:

- `hashPassword(password)` - Hash passwords with bcrypt
- `verifyPassword(password, hash)` - Verify password against hash
- `signToken(payload)` - Create JWT with user data
- `verifyToken(token)` - Verify and decode JWT
- `requireAuth(req)` - Middleware to require authentication
- `requireRole(allowedRoles, req)` - Middleware to require specific role(s)

## 📊 Data Models

All models are located in `src/models/` and use Mongoose schemas.

### User
- `name`, `email`, `passwordHash`
- `role`: ADMIN | SDR | CLIENT
- `clientId`: Optional reference to Client (for CLIENT users)
- `isActive`: Boolean

### Client
- Business information (name, address)
- Point of contact details
- `accountManagerId`: Reference to User
- `currentPlanId`: Reference to Plan
- `creditsAvailable`: Number

### Plan
- `name`, `description`
- `pricePerMonth`, `creditsPerMonth`
- `features`: Array of strings

### License
- `clientId`: Reference to Client
- `serviceType`, `label`
- `status`: active | paused
- `startDate`, `endDate`

### SdrClientAssignment
- `sdrId`: Reference to User (SDR)
- `clientId`: Reference to Client
- `licenses`: Array of License references

### Report
- `clientId`, `licenseId` (optional)
- `type`: WEEKLY | MONTHLY | QUARTERLY
- `periodStart`, `periodEnd`
- `summary`, `metrics` (flexible object)
- `createdBy`: Reference to User

### Invoice
- `clientId`
- `typeOfService`, `numberOfServices`
- `amount`, `currency`, `dueDate`
- `status`: PENDING | PAID | OVERDUE
- `paidAt` (optional)

### Contract
- `clientId`
- `fileUrl`: URL to PDF contract
- `signedDate`, `version`

### Message (for future chat system)
- `clientId`, `sdrId`
- `senderRole`: CLIENT | SDR
- `text`, `read`, `createdAt`

## 🔌 API Routes

All API routes are under `src/app/api/`.

### Authentication Routes

#### `POST /api/auth/login`
Login with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "CLIENT",
    "clientId": "..."
  }
}
```

**Errors**: 400 (missing fields), 401 (invalid credentials), 403 (inactive account)

#### `POST /api/auth/logout`
Clear authentication cookie.

**Response**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Admin Routes (require ADMIN role)

#### `POST /api/admin/users`
Create a new user (ADMIN, SDR, or CLIENT).

**Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepassword",
  "role": "SDR",
  "isActive": true
}
```

For CLIENT role, also include:
```json
{
  "clientId": "client_object_id"
}
```

#### `POST /api/admin/clients`
Create a new client.

**Request Body**:
```json
{
  "businessName": "Acme Corp",
  "businessAddress": "123 Main St, City, State 12345",
  "pointOfContactName": "John Doe",
  "pointOfContactEmail": "john@acme.com",
  "pointOfContactPhone": "+1-555-0100",
  "accountManagerId": "user_object_id",
  "currentPlanId": "plan_object_id",
  "creditsAvailable": 100
}
```

#### `POST /api/admin/assign-sdr`
Assign an SDR to a client with specific licenses.

**Request Body**:
```json
{
  "sdrId": "sdr_user_object_id",
  "clientId": "client_object_id",
  "licenseIds": ["license_id_1", "license_id_2"]
}
```

#### `GET /api/admin/clients`
List all clients with account managers and SDR assignments.

**Response**:
```json
{
  "success": true,
  "clients": [
    {
      "_id": "...",
      "businessName": "Acme Corp",
      "accountManagerId": {...},
      "sdrAssignments": [...]
    }
  ]
}
```

---

### Client Routes (require CLIENT role)

All client routes automatically use the `clientId` from the JWT token for security.

#### `GET /api/client/dashboard`
Get dashboard overview with targets, services, and account manager.

**Response**:
```json
{
  "success": true,
  "client": {...},
  "targetsAndDeliverables": {...},
  "numberOfServices": 3,
  "currentMonthStatus": {...},
  "accountManager": {...},
  "plan": {...}
}
```

#### `GET /api/client/plan`
Get current plan details and available credits.

#### `GET /api/client/reports`
Get reports with optional filtering.

**Query Parameters**:
- `type`: WEEKLY | MONTHLY | QUARTERLY
- `from`: ISO date string (filter by periodStart >= from)
- `to`: ISO date string (filter by periodStart <= to)

**Example**: `/api/client/reports?type=MONTHLY&from=2024-01-01`

#### `GET /api/client/billing`
Get billing information including upcoming, overdue, and paid invoices.

**Response**:
```json
{
  "success": true,
  "billing": {
    "upcoming": [...],
    "overdue": [...],
    "history": [...]
  }
}
```

#### `GET /api/client/contract`
Get the most recent contract for the client.

---

### SDR Routes (require SDR role)

#### `GET /api/sdr/clients`
List all clients assigned to the authenticated SDR.

**Response**:
```json
{
  "success": true,
  "clients": [
    {
      "clientId": "...",
      "businessName": "Acme Corp",
      "pointOfContact": {...},
      "licenses": [...],
      "assignedAt": "2024-01-15T..."
    }
  ]
}
```

#### `POST /api/sdr/reports`
Create a report for an assigned client.

**Request Body**:
```json
{
  "clientId": "client_object_id",
  "licenseId": "license_object_id",
  "type": "WEEKLY",
  "periodStart": "2024-01-01",
  "periodEnd": "2024-01-07",
  "summary": "This week we achieved...",
  "metrics": {
    "connectionsRequested": 50,
    "connectionsAccepted": 35,
    "messageseSent": 100
  }
}
```

---

### Message Routes (Future - Currently 501 Not Implemented)

Placeholder routes exist for future chat system:

- `GET /api/messages` - List messages
- `POST /api/messages` - Send message
- `GET /api/messages/[conversationId]` - Get conversation
- `GET /api/messages/unread` - Get unread count

See route files for detailed implementation plans.

## 📁 Project Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       └── page.tsx              # Admin dashboard UI (placeholder)
│   │   ├── (sdr)/
│   │   │   └── sdr/
│   │   │       └── page.tsx              # SDR dashboard UI (placeholder)
│   │   ├── (client)/
│   │   │   └── client/
│   │   │       └── page.tsx              # Client dashboard UI (placeholder)
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── admin/
│   │   │   │   ├── users/route.ts
│   │   │   │   ├── clients/route.ts
│   │   │   │   └── assign-sdr/route.ts
│   │   │   ├── client/
│   │   │   │   ├── dashboard/route.ts
│   │   │   │   ├── plan/route.ts
│   │   │   │   ├── reports/route.ts
│   │   │   │   ├── billing/route.ts
│   │   │   │   └── contract/route.ts
│   │   │   ├── sdr/
│   │   │   │   ├── clients/route.ts
│   │   │   │   └── reports/route.ts
│   │   │   └── messages/
│   │   │       ├── route.ts              # Placeholder
│   │   │       ├── [conversationId]/route.ts
│   │   │       └── unread/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx                      # Root page with links
│   ├── lib/
│   │   ├── db.ts                         # MongoDB connection
│   │   └── auth.ts                       # Auth utilities
│   └── models/
│       ├── User.ts
│       ├── Client.ts
│       ├── Plan.ts
│       ├── License.ts
│       ├── SdrClientAssignment.ts
│       ├── Report.ts
│       ├── Invoice.ts
│       ├── Contract.ts
│       └── Message.ts
├── package.json
├── tsconfig.json
├── next.config.mjs
├── env.example
└── README.md
```

## 🧪 Testing the API

You can test the API using curl, Postman, or any HTTP client.

### Example: Create an Admin User

First, you'll need to manually create an admin user in your MongoDB database, or use the MongoDB shell:

```javascript
// In MongoDB shell or Compass
db.users.insertOne({
  name: "Admin User",
  email: "admin@millioncxo.com",
  passwordHash: "$2a$10$...", // Hash of your password using bcrypt
  role: "ADMIN",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

Or use Node.js to hash a password:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('your-password', 10);
console.log(hash);
```

### Example: Login Request

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@millioncxo.com",
    "password": "your-password"
  }'
```

### Example: Create a Client (requires admin login)

```bash
curl -X POST http://localhost:3001/api/admin/clients \
  -H "Content-Type: application/json" \
  -H "Cookie: dashboard_token=YOUR_JWT_TOKEN" \
  -d '{
    "businessName": "Test Company",
    "businessAddress": "123 Test St",
    "pointOfContactName": "John Doe",
    "pointOfContactEmail": "john@test.com",
    "pointOfContactPhone": "+1-555-0100"
  }'
```

## 🔮 Future Enhancements

### Chat System
The Message model and placeholder API routes are ready. Future implementation will include:
- Real-time messaging between SDRs and clients
- WebSocket or Server-Sent Events for live updates
- Message notifications and unread badges
- File attachment support

### Full UI Implementation
Current placeholder pages will be replaced with:
- Beautiful, modern interface matching MillionCXO theme
- Left sidebar navigation
- Interactive dashboards with charts and metrics
- Form interfaces for creating/editing data
- Real-time updates and notifications

### Additional Features
- License management UI for admins
- Plan creation and editing
- Invoice payment processing integration
- Contract upload and e-signature integration
- Advanced reporting and analytics
- Activity feed and audit logs
- Email notifications
- Export functionality (CSV, PDF reports)

## 🛡️ Security Considerations

- **Passwords**: Hashed with bcrypt (10 rounds)
- **JWT**: 7-day expiration, stored in HttpOnly cookies
- **Authorization**: Every protected route checks role permissions
- **Data Access**: CLIENT users can only access their own data via JWT clientId
- **SDR Access**: SDRs can only access clients they're assigned to
- **Environment**: Sensitive credentials in `.env` (never committed to git)

## 📝 Development Notes

- The dashboard runs on **port 3001** to avoid conflicts with the main website (port 3000)
- All code is isolated in the `dashboard/` directory
- No modifications to the root application code
- MongoDB connection uses caching to prevent connection exhaustion
- Mongoose models use `mongoose.models.*` pattern to prevent hot-reload issues

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct in `.env`
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure database user has read/write permissions

### JWT/Cookie Issues
- Make sure `JWT_SECRET` is set in `.env`
- Check browser cookies in DevTools
- Verify CORS settings if accessing from different domain

### Port Conflicts
- Change port in `package.json` scripts if 3001 is in use
- Update: `"dev": "next dev -p YOUR_PORT"`

## 📞 Support

For questions or issues with the dashboard module, please contact the development team or refer to the main MillionCXO repository documentation.

---

**Built with ❤️ for MillionCXO**

