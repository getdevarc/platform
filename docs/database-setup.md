# DevArc — Database Setup (Supabase)

> PostgreSQL (Supabase Managed) | Development Setup Guide

---

## Overview

DevArc uses **Supabase Managed PostgreSQL** instead of a local PostgreSQL installation.

Using Supabase provides:

- No local database configuration
- Managed PostgreSQL infrastructure
- Easy connection using a single connection string
- Production-ready environment
- Free development tier

---

## Step 1 — Create a Supabase Project

Go to [https://supabase.com](https://supabase.com) and follow these steps:

1. Login to Supabase
2. Click **New Project**
3. Fill in the project details:

   ```
   Project Name: devarc
   Database Password: <your-secure-password>
   Region: closest available
   ```

4. Click **Create Project**

Supabase will automatically provision a managed PostgreSQL database.

---

## Step 2 — Get Database Connection String

1. Open your project dashboard
2. Navigate to **Settings → Database → Connection String**
3. Select **URI**

Example:

```
postgresql://postgres:YOUR_PASSWORD@db.wobomiocfvaqihbakgee.supabase.co:5432/postgres
```

This is the connection string used by the backend.

---

## Step 3 — Configure Backend Environment

Update `backend/.env`:

```env
PORT=5050
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.wobomiocfvaqihbakgee.supabase.co:5432/postgres
JWT_SECRET=dev_secret
```

> Replace `YOUR_PASSWORD` with the database password you set while creating the Supabase project.

---

## Step 4 — Ensure dotenv is Loaded

In `backend/src/server.js`:

```javascript
require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`DevArc API running on port ${PORT}`);
});
```

---

## Step 5 — Create Database Tables

1. Open your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

## Step 6 — Start Backend Server

```bash
cd backend
npm run dev
```

Expected output:

```
DevArc API running on port 5050
```

---

## Step 7 — Test Register API

**Endpoint:** `POST /auth/register`

**Request:**

```http
POST http://localhost:5050/auth/register
Content-Type: application/json

{
  "name": "Aman",
  "email": "aman@test.com",
  "password": "123456"
}
```

**Expected Response:**

```json
{
  "id": "c43556f4-4685-4fe6-ad44-2450ac6934eb",
  "name": "Aman",
  "email": "aman@test.com"
}
```

This confirms:

- Backend API is working
- Database connection is successful
- User record is stored in PostgreSQL

---

## DevArc Backend Data Flow

```
Postman
   ↓
Express Route
   ↓
Auth Controller
   ↓
Auth Service
   ↓
User Repository
   ↓
Supabase PostgreSQL
```