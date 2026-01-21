# Database Setup Guide

## Prerequisites
- PostgreSQL installed and running
- Node.js installed

## Setup Steps

### 1. Create Database
```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE ims_db;
-- Create user (optional)
CREATE USER ims_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ims_db TO ims_user;
```

### 2. Update Database Configuration
Update the database configuration in `backend/src/config/db.js` or create a `.env` file in the backend directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ims_db
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

### 3. Run Database Setup
```bash
cd database
node setup_database.js
```

### 4. Start Backend Server
```bash
cd backend
npm install
npm run dev
```

### 5. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Inventory
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/summary` - Get inventory summary
- `GET /api/inventory/:id` - Get specific item
- `POST /api/inventory` - Create new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item
- `POST /api/inventory/adjust` - Adjust stock

### Reports
- `GET /api/reports` - General reports dashboard
- `GET /api/reports/abc-analysis` - ABC Analysis
- `GET /api/reports/stock-valuation` - Stock Valuation
- `GET /api/reports/analytics` - Analytics data

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

## Sample Data
The setup script creates:
- 3 categories (Electronics, Furniture, Office Supplies)
- 3 units of measure (Pieces, Boxes, Kilograms)
- 2 warehouses
- 5 sample inventory items

## Features Connected
✅ Dashboard with real data
✅ Inventory management
✅ ABC Analysis reports
✅ Stock Valuation reports
✅ Navigation menu with all modules
✅ API integration between frontend and backend

## Next Steps
1. Set up authentication
2. Add more inventory management features
3. Implement purchase orders
4. Add supplier management
5. Create GRN (Goods Receipt Note) functionality
