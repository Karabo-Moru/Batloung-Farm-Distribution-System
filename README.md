# Batloung Farm Distribution System

## Project Overview
The Batloung Farm Distribution System is a web-based application developed to manage fruit distribution operations in Maseru, Lesotho.

The system helps the business manage suppliers, fruits, vendors, purchases, sales, stock levels, payments and business reports.

## Project Objectives
- Manage supplier and vendor information.
- Register and manage fruits.
- Record purchases from suppliers.
- Record sales to vendors.
- Track stock by packaging size.
- Manage customer payments and outstanding balances.
- Generate business reports.

## Technologies Used
- **Frontend:** React.js, HTML, CSS and JavaScript
- **Backend:** Node.js and Express.js
- **Database:** MySQL
- **API:** REST API
- **Database connection:** MySQL2
- **Environment configuration:** dotenv

## System Features

### 1. Dashboard
Displays an overview of the business, including fruits, suppliers, vendors and stock information.

### 2. Supplier Management
- Register suppliers.
- View supplier records.
- Search and update supplier information.
- Delete suppliers where database constraints allow.

### 3. Fruit Management
- Register fruits.
- View and update fruit information.
- Manage fruit availability.

### 4. Vendor Management
- Register vendors.
- View and search vendors.
- Update vendor information.

### 5. Stock Management
- Track fruit quantities by Small, Medium and Large packaging sizes.
- View available stock.
- Identify low-stock items.

### 6. Purchase Management
- Record purchases from suppliers.
- Record multiple fruits in one purchase.
- Calculate purchase totals.
- Automatically increase stock after a successful purchase.

### 7. Sales Management
- Record sales to vendors.
- Record multiple fruits in one sale.
- Calculate sales totals.
- Automatically reduce stock after a successful sale.
- Prevent sales when available stock is insufficient.

### 8. Payment Management
- Record Cash, Mobile Money and Credit payments.
- Track paid, partially paid and unpaid sales.
- Calculate outstanding balances.

### 9. Business Reports
- Top five sold fruits.
- Revenue within a selected date range.
- Top vendor by boxes purchased.
- Stock quantities by fruit and packaging size.

## Database Structure
The system uses the following eight MySQL tables:

1. Suppliers
2. Fruits
3. Vendors
4. Purchases
5. PurchaseDetails
6. Sales
7. SalesDetails
8. Stock

## Project Folder Structure

```text
Batloung_Farm_Distribution_System/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
│
├── .gitignore
└── README.md
```

## Installation and Setup

### Requirements
- Node.js
- MySQL Server
- Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/Karabo-Moru/Batloung-Farm-Distribution-System.git
```

### 2. Set Up the Backend

```bash
cd Batloung-Farm-Distribution-System/backend
npm install
```

Create a `.env` file inside the backend folder using `.env.example` as a guide.

Configure the following environment variables:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=batloung_farm_db
PORT=5000
```

Import or create the project database in MySQL.

### 3. Start the Backend

```bash
npm start
```

The backend API runs at:

```text
http://localhost:5000/api
```

### 4. Set Up the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## Business Rules
- Stock is tracked separately for Small, Medium and Large packages.
- Purchases increase available stock.
- Successful sales decrease available stock.
- Stock quantities cannot become negative.
- Sale and purchase totals are calculated automatically.
- Database transactions protect multi-item operations.
- Payments update the outstanding balance of a sale.

## Developer
**Developer:** Karabo Moru

**Project:** Batloung Farm Distribution System

**Course:** DIWA2110 Web Application Development

**Institution:** Limkokwing University of Creative Technology

## Project Status
The application has been developed with React, Node.js, Express and MySQL. Production build testing and backend connection testing have been completed. Deployment is pending.