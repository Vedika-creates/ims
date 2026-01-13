import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import Button from '../components/Button'
import Modal from '../components/Modal'

const Dashboard = () => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  // Mock data for now - will be replaced with API calls
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setInventory([
        {
          id: 1,
          name: 'Laptop Dell XPS 15',
          sku: 'LAP-001',
          category: 'Electronics',
          currentStock: 15,
          minStock: 10,
          maxStock: 50,
          unitPrice: 1299.99,
          supplier: 'Tech Supplies Inc',
          lastRestocked: '2024-01-10',
          status: 'normal'
        },
        {
          id: 2,
          name: 'Office Chair Ergonomic',
          sku: 'CHR-001',
          category: 'Furniture',
          currentStock: 5,
          minStock: 15,
          maxStock: 30,
          unitPrice: 299.99,
          supplier: 'Furniture Plus',
          lastRestocked: '2024-01-05',
          status: 'low'
        },
        {
          id: 3,
          name: 'Wireless Mouse',
          sku: 'MOU-001',
          category: 'Electronics',
          currentStock: 45,
          minStock: 20,
          maxStock: 100,
          unitPrice: 29.99,
          supplier: 'Tech Supplies Inc',
          lastRestocked: '2024-01-08',
          status: 'normal'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getStockStatus = (item) => {
    if (item.currentStock <= item.minStock) {
      return { status: 'low', color: 'text-red-600 bg-red-100', icon: AlertTriangle }
    } else if (item.currentStock >= item.maxStock * 0.8) {
      return { status: 'high', color: 'text-yellow-600 bg-yellow-100', icon: TrendingUp }
    } else {
      return { status: 'normal', color: 'text-green-600 bg-green-100', icon: TrendingDown }
    }
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || getStockStatus(item).status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: inventory.length,
    lowStock: inventory.filter(item => item.currentStock <= item.minStock).length,
    normalStock: inventory.filter(item => {
      const status = getStockStatus(item)
      return status.status === 'normal'
    }).length,
    totalValue: inventory.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading inventory...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <TrendingDown className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Normal Stock</p>
              <p className="text-2xl font-bold text-green-600">{stats.normalStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-field max-w-xs"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="low">Low Stock</option>
            <option value="normal">Normal</option>
            <option value="high">High Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Levels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item)
                const StatusIcon = stockStatus.icon
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {stockStatus.status.charAt(0).toUpperCase() + stockStatus.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Current: <span className="font-medium">{item.currentStock}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Min: {item.minStock} | Max: {item.maxStock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900 mr-3">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Item"
        size="lg"
      >
        <div className="text-center py-8 text-gray-500">
          Add item form will be implemented here
        </div>
      </Modal>
    </div>
  )
}

export default Dashboard
