import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// User Module
import UserProfile from './pages/users/UserProfile'
import UserManagement from './pages/users/UserManagement'

// Item & Catalog Module
import ItemCatalog from './pages/items/ItemCatalog'
import ItemDetails from './pages/items/ItemDetails'
import AddItem from './pages/items/AddItem'

// Stock Location & Warehouse Module
import WarehouseList from './pages/warehouses/WarehouseList'
import WarehouseDetails from './pages/warehouses/WarehouseDetails'
import StockLocations from './pages/warehouses/StockLocations'
import TransferOrders from './pages/warehouses/TransferOrders'

// Transfer Orders Module
import TransferOrdersList from './pages/transfers/TransferOrdersList'
import TransferOrderDetails from './pages/transfers/TransferOrderDetails'

// Goods Receipt & Putaway Module
import GRNList from './pages/grn/GRNList'
import CreateGRN from './pages/grn/CreateGRN'
import GRNDetails from './pages/grn/GRNDetails'

// Supplier & Purchase Module
import SupplierList from './pages/purchasing/SupplierList'
import SupplierDetails from './pages/purchasing/SupplierDetails'
import PurchaseRequisitions from './pages/purchasing/PurchaseRequisitions'
import PurchaseOrdersSimple from './pages/purchasing/PurchaseOrdersSimple'
import PODetails from './pages/purchasing/PODetails'

// Reorder Automation & Alerts Module
import ReorderRules from './pages/automation/ReorderRules'
import Alerts from './pages/automation/Alerts'
import AutoPOSuggestions from './pages/automation/AutoPOSuggestions'

// Batch/Serial & Expiry Management
import BatchTracking from './pages/tracking/BatchTracking'
import SerialTracking from './pages/tracking/SerialTracking'
import ExpiryManagement from './pages/tracking/ExpiryManagement'

// Reporting & Analytics Module
import Reports from './pages/reports/Reports'
import StockValuation from './pages/reports/StockValuation'
import ABCAnalysis from './pages/reports/ABCAnalysis'
import Analytics from './pages/reports/Analytics'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* User Module */}
          <Route path="profile" element={<UserProfile />} />
          <Route path="users" element={<UserManagement />} />
          
          {/* Item & Catalog Module */}
          <Route path="items" element={<ItemCatalog />} />
          <Route path="items/:id" element={<ItemDetails />} />
          <Route path="items/add" element={<AddItem />} />
          
          {/* Stock Location & Warehouse Module */}
          <Route path="warehouses" element={<WarehouseList />} />
          <Route path="warehouses/:id" element={<WarehouseDetails />} />
          <Route path="warehouses/:id/locations" element={<StockLocations />} />
          <Route path="transfers" element={<TransferOrders />} />
          
          {/* Transfer Orders Module */}
          <Route path="transfer-orders" element={<TransferOrdersList />} />
          <Route path="transfer-orders/:id" element={<TransferOrderDetails />} />
          
          {/* Goods Receipt & Putaway Module */}
          <Route path="grn" element={<GRNList />} />
          <Route path="grn/create" element={<CreateGRN />} />
          <Route path="grn/:id" element={<GRNDetails />} />
          
          {/* Supplier & Purchase Module */}
          <Route path="suppliers" element={<SupplierList />} />
          <Route path="suppliers/:id" element={<SupplierDetails />} />
          <Route path="purchasing/requisitions" element={<PurchaseRequisitions />} />
          <Route path="purchasing/orders" element={<PurchaseOrdersSimple />} />
          <Route path="purchasing/orders/:id" element={<PODetails />} />
          
          {/* Reorder Automation & Alerts Module */}
          <Route path="automation/reorder-rules" element={<ReorderRules />} />
          <Route path="automation/alerts" element={<Alerts />} />
          <Route path="automation/auto-po" element={<AutoPOSuggestions />} />
          
          {/* Batch/Serial & Expiry Management */}
          <Route path="tracking/batches" element={<BatchTracking />} />
          <Route path="tracking/serials" element={<SerialTracking />} />
          <Route path="tracking/expiry" element={<ExpiryManagement />} />
          
          {/* Reporting & Analytics Module */}
          <Route path="reports" element={<Reports />} />
          <Route path="reports/stock-valuation" element={<StockValuation />} />
          <Route path="reports/abc-analysis" element={<ABCAnalysis />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
