# Personal-Finance-Tracker

# Personal Finance Tracker

A full-stack Personal Finance Tracker built with **React**, **Node.js**, **Express.js**, **PostgreSQL**, and **Redis**. The application enables users to securely manage their finances, categorize transactions, and analyze spending patterns through an intuitive dashboard.

---

## Features

* Secure JWT-based Authentication
* Role-Based Access Control (Admin, User, Read-Only)
* Income & Expense Management
* Category Management
* Analytics Dashboard with Charts
* Responsive User Interface
* PostgreSQL Database
* Redis Caching for Improved Performance
* RESTful API
* Form Validation
* Error Handling
* Protected Routes

---

## Tech Stack

### Frontend

* React 18
* React Router
* Axios
* Tailwind CSS
* Chart.js / Recharts

### Backend

* Node.js
* Express.js
* JWT Authentication
* bcrypt
* PostgreSQL
* Redis

### Database

* PostgreSQL

### Caching

* Redis

---

## Project Structure

```
Personal-Finance-Tracker/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── database/
│   │   ├── schema.sql
│   │   ├── seed.sql
│   │   └── indexes.sql
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Akshit568/Personal-Finance-Tracker.git
cd Personal-Finance-Tracker
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file and configure your PostgreSQL and Redis credentials.

Start the backend:

```bash
npm run dev
```

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

The frontend will run at:

```
http://localhost:5173
```

The backend will run at:

```
http://localhost:5000
```

---

## Database Setup

1. Create a PostgreSQL database named:

```
finance_tracker
```

2. Execute the following SQL files in order:

* `database/schema.sql`
* `database/seed.sql`
* `database/indexes.sql`

---

## Redis Setup

Run Redis locally using Docker:

```bash
docker run -d --name redis -p 6379:6379 redis
```

Verify Redis is running:

```bash
docker ps
```

---

## API Documentation

Swagger documentation is available at:

```
http://localhost:5000/api/docs
```

---

## User Roles

### Admin

* Manage users
* Manage categories
* View analytics
* Manage all transactions

### User

* Create transactions
* Update personal transactions
* Delete personal transactions
* View analytics

### Read-Only

* View transactions
* View analytics
* No create, update, or delete permissions

---

## Security

* JWT Authentication
* Password Hashing with bcrypt
* Protected Routes
* Role-Based Authorization
* Parameterized SQL Queries (No ORM)
* Environment Variable Configuration

---

## Future Improvements

* Monthly Budget Management
* Savings Goals
* Recurring Transactions
* Email Notifications
* Export Reports (PDF/Excel)
* Dark Mode
* Multi-Currency Support

---

## Author

**Akshit Thakur**

GitHub: https://github.com/Akshit568

---

## License

This project is developed for educational and portfolio purposes.
