# Inventory Management System (IMS)

A comprehensive full-stack inventory management and reorder system built with React, Node.js, and PostgreSQL.

## 🚀 Features

### Core Features
- **Multi-warehouse Support**: Manage inventory across multiple warehouses and locations
- **Role-based Access Control**: Admin, Inventory Manager, and Warehouse Staff roles
- **Real-time Stock Tracking**: Monitor stock levels with automatic low-stock alerts
- **Purchase Order Management**: Complete PR → PO workflow with approval system
- **Batch & Serial Tracking**: Track items by batch numbers and serial numbers
- **Expiry Management**: Monitor expiry dates with automated alerts
- **Transfer Orders**: Move inventory between warehouses with approval workflow

### Advanced Features
- **Reorder Automation**: Automatic PO suggestions based on consumption patterns
- **ABC Analysis**: Classify items by value for better inventory management
- **Supplier Management**: Track supplier performance and pricing tiers
- **Goods Receipt Notes (GRN)**: Capture batch/lot and expiry information
- **Audit Logging**: Complete audit trail for all inventory movements
- **Scheduled Reports**: Automated reports with email delivery
- **Multi-location Support**: Aisles, shelves, and bins within warehouses

### Reporting & Analytics
- **Stock Valuation**: FIFO and Weighted Average costing methods
- **Supplier Performance**: Track delivery times and order values
- **Movement History**: Complete audit trail of all stock movements
- **Expiry Tracking**: Monitor items approaching expiry
- **Low Stock Alerts**: Real-time notifications for critical items

## 🏗️ Architecture

### Frontend (React + Tailwind CSS)
- Modern React application with functional components and hooks
- Tailwind CSS for responsive, utility-first styling
- React Router for navigation
- Axios for API communication
- Context API for state management
- Lucide React for icons

### Backend (Node.js + Express)
- RESTful API with Express.js
- PostgreSQL database with advanced queries and views
- JWT-based authentication
- Role-based authorization middleware
- Input validation with express-validator
- Comprehensive error handling
- Rate limiting and security headers

### Database (PostgreSQL)
- Normalized schema with 20+ tables
- Automated triggers for stock level updates
- Materialized views for reporting
- Audit logging for compliance
- Indexes for optimal performance

## 📁 Project Structure

```
ims-1/
├── client/                     # Frontend (React + Tailwind)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/             # Images, icons, fonts
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Navbar.jsx
│   │   ├── pages/              # Page-level components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── layouts/            # Layout wrappers
│   │   │   └── MainLayout.jsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useAuth.js
│   │   ├── services/           # API calls (Axios/Fetch)
│   │   │   └── api.js
│   │   ├── context/            # Context API (Auth, Theme)
│   │   │   └── AuthContext.jsx
│   │   ├── utils/              # Helper functions
│   │   │   └── formatDate.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind base styles
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── .env
├── server/                     # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/             # DB & environment config
│   │   │   └── db.js
│   │   ├── models/             # Database queries/models
│   │   │   ├── userModel.js
│   │   │   └── inventoryModel.js
│   │   ├── controllers/        # Business logic
│   │   │   ├── userController.js
│   │   │   └── inventoryController.js
│   │   ├── routes/             # API routes
│   │   │   ├── userRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   └── inventoryRoutes.js
│   │   ├── middlewares/        # Auth, error handling
│   │   │   └── authMiddleware.js
│   │   ├── utils/              # Utility functions
│   │   │   └── jwt.js
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Server entry point
│   ├── package.json
│   └── .env
├── database/                   # PostgreSQL related files
│   ├── migrations/             # Database migrations
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_inventory_tables.sql
│   │   ├── 003_create_purchase_orders.sql
│   │   ├── 004_create_tracking_tables.sql
│   │   ├── 005_create_automation_tables.sql
│   │   └── 006_create_views.sql
│   ├── seeds/
│   │   └── seed_data.sql
│   └── schema.sql
├── .gitignore
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Database Setup

1. **Create Database**
   ```sql
   CREATE DATABASE ims_db;
   \c ims_db;
   ```

2. **Run Schema**
   ```bash
   psql -d ims_db -f database/schema.sql
   ```

3. **Run Migrations (Optional - if using individual migration files)**
   ```bash
   for file in database/migrations/*.sql; do
     psql -d ims_db -f "$file"
   done
   ```

4. **Seed Data (Optional)**
   ```bash
   psql -d ims_db -f database/seeds/seed_data.sql
   ```

### Backend Setup

1. **Navigate to Server Directory**
   ```bash
   cd server
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Copy `.env` file and update with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ims_db
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

4. **Start Server**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to Client Directory**
   ```bash
   cd client
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Update `.env` file if needed:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Application will run on `http://localhost:3000`

## 🔐 Default Login Credentials

- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / admin123  
- **Staff**: staff@example.com / admin123

## 📊 Database Schema Overview

### Core Tables
- **users**: User management with role-based access
- **inventory**: Master inventory items
- **warehouses**: Warehouse information
- **locations**: Storage locations within warehouses
- **suppliers**: Supplier management
- **categories**: Item categorization

### Transaction Tables
- **purchase_requisitions**: Purchase requests
- **purchase_orders**: Purchase orders with approval workflow
- **goods_receipt_notes**: GRN for receiving items
- **stock_movements**: Complete audit trail
- **transfer_orders**: Inter-warehouse transfers

### Tracking Tables
- **batches**: Batch/lot tracking
- **serial_numbers**: Serial number tracking
- **stock_levels**: Location-specific stock levels

### Automation Tables
- **reorder_rules**: Automated reorder logic
- **alerts**: System alerts and notifications
- **audit_log**: Complete audit trail
- **scheduled_reports**: Automated reporting

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification

### Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create new item
- `GET /api/inventory/:id` - Get specific item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item
- `GET /api/inventory/stats` - Get inventory statistics
- `GET /api/inventory/low-stock` - Get low stock items

### Purchase Orders
- `GET /api/purchase-orders` - Get all purchase orders
- `POST /api/purchase-orders` - Create purchase order
- `PUT /api/purchase-orders/:id/approve` - Approve purchase order

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests (when implemented)
cd client
npm test
```

### Code Style
- ESLint for JavaScript linting
- Prettier for code formatting
- Consistent naming conventions

## 📈 Features in Development

- [ ] Mobile responsive design
- [ ] Advanced reporting dashboard
- [ ] Email notifications
- [ ] Barcode scanning integration
- [ ] API documentation (Swagger)
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please email vedikakumbhar1007@gmail.com or create an issue in the repository.

---

**Built with ❤️ using React, Node.js, and PostgreSQL**
