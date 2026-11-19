
# Batloung Farm Distribution System

## 1. Project Overview

The Batloung Farm Distribution System is a web-based application developed to manage the daily operations of a fruit distribution business based in Maseru, Lesotho.

The business purchases fruits from suppliers across different provinces of South Africa and distributes them to street vendors and small retailers in Lesotho.

The system helps manage suppliers, fruits, vendors, purchases, sales, stock levels and payments.

## 2. Project Objectives

- To manage supplier information.
- To register and manage fruits.
- To manage vendor information.
- To record fruit purchases from suppliers.
- To record fruit sales to vendors.
- To monitor stock quantities by packaging size.
- To manage payments and outstanding balances.
- To generate business reports.

## 3. Technologies Used

### Frontend
- React.js
- Vite
- CSS
- JavaScript

### Backend
- Node.js
- Express.js
- MySQL2
- REST API

### Database
- MySQL

## 4. System Features

### Dashboard
Displays an overview of the business operations.

### Supplier Management
- Register suppliers.
- View all suppliers.
- Search and retrieve suppliers.
- Update supplier information.
- Delete suppliers when they are not linked to purchase records.

### Fruit Management
- Register fruits.
- View available fruits.
- Update fruit information.
- Manage fruit availability.

### Vendor Management
- Register vendors.
- View vendor records.
- Search vendors.
- Update vendor information.

### Stock Management
- Track fruit stock by packaging size.
- Monitor Small, Medium and Large packages.
- View available quantities.
- Identify low-stock items.

### Purchase Management
- Record purchases from suppliers.
- Add multiple fruits to a purchase.
- Calculate purchase totals.
- Automatically increase stock quantities.

### Sales Management
- Record sales to vendors.
- Add multiple fruits to a sale.
- Calculate sale totals.
- Automatically deduct stock.
- Prevent sales when stock is insufficient.

### Payment Management
- Record payments.
- Support Cash, Mobile Money and Credit.
- Track PAID, PARTIALLY_PAID and UNPAID sales.
- View outstanding vendor balances.

### Business Reports
- Top five sold fruits.
- Revenue within a selected date range.
- Top vendor by boxes purchased.
- Stock quantities by fruit and packaging size.

## 5. Database Structure

The system uses the following eight database tables:

1. Suppliers
2. Fruits
3. Vendors
4. Purchases
5. PurchaseDetails
6. Sales
7. SalesDetails
8. Stock

## 6. Project Folder Structure

text
Batloung_Farm_Distribution_System/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── README.md


## 7. Installation and Setup

### Requirements

- Node.js
- MySQL
- Visual Studio Code

### Step 1: Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_LINK
```

### Step 2: Backend Setup

Open the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Configure the database connection in a `.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=batloung_farm_db
PORT=5000
```

Create the MySQL database and import the project database tables and sample data.

Start the backend:

```bash
npm start
```

The backend runs on:

```text
http://localhost:5000
```

### Step 3: Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Open the local URL provided by Vite in your browser.

## 8. API Base URL

During local development:

```text
http://localhost:5000/api
```

The API provides endpoints for suppliers, fruits, vendors, stock, purchases, sales, reports and payments.

## 9. Business Rules

- Stock is tracked separately for Small, Medium and Large packages.
- Purchases increase available stock.
- Sales decrease available stock.
- Stock quantities cannot become negative.
- Sales are processed using database transactions.
- Failed sales transactions do not leave partial stock deductions.
- Vendor payments are tracked against outstanding balances.

## 10. Developer Information

**Project Name:** Batloung Farm Distribution System

**Course:** DIWA2110 - Web Application Development

**Institution:** Limkokwing University of Creative Technology

**Developer: Karabo Moru

Project Year: 2026

## 11. Project Status

The system is under development and preparation for deployment.
