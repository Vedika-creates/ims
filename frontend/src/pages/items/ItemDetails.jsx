import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Package, ArrowLeft, Edit, Trash2, History, MapPin, AlertTriangle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

const ItemDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [stockHistory, setStockHistory] = useState([])
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    // Mock data - replace with API call
    const mockItem = {
      id: parseInt(id),
      sku: 'LAP-001',
      name: 'Laptop Dell Latitude',
      description: 'Business laptop with 16GB RAM and 512GB SSD, perfect for enterprise use',
      category: 'Electronics',
      unitOfMeasure: 'Units',
      leadTime: 14,
      safetyStock: 10,
      reorderPoint: 15,
      maxStock: 100,
      currentStock: 25,
      cost: 800,
      sellingPrice: 1200,
      supplier: 'Tech Supplies Inc',
      warehouse: 'Warehouse A',
      location: 'A-01-01',
      batchTracking: true,
      serialTracking: true,
      expiryTracking: false,
      status: 'Active',
      lastUpdated: '2024-01-14T10:30:00Z',
      createdAt: '2023-06-15T09:00:00Z'
    }

    const mockStockHistory = [
      { date: '2024-01-14', type: 'IN', quantity: 10, reference: 'GRN-001', balance: 25 },
      { date: '2024-01-10', type: 'OUT', quantity: 5, reference: 'SO-001', balance: 15 },
      { date: '2024-01-08', type: 'IN', quantity: 20, reference: 'GRN-002', balance: 20 },
      { date: '2024-01-05', type: 'OUT', quantity: 8, reference: 'SO-002', balance: 0 },
      { date: '2024-01-01', type: 'IN', quantity: 15, reference: 'GRN-003', balance: 8 }
    ]

    const mockTransactions = [
      { id: 1, date: '2024-01-14T10:30:00Z', type: 'Goods Receipt', reference: 'GRN-001', quantity: 10, user: 'John Doe', status: 'Completed' },
      { id: 2, date: '2024-01-10T14:15:00Z', type: 'Sales Order', reference: 'SO-001', quantity: 5, user: 'Jane Smith', status: 'Completed' },
      { id: 3, date: '2024-01-08T09:45:00Z', type: 'Goods Receipt', reference: 'GRN-002', quantity: 20, user: 'Mike Johnson', status: 'Completed' }
    ]

    setItem(mockItem)
    setStockHistory(mockStockHistory)
    setTransactions(mockTransactions)
  }, [id])

  if (!item) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const getStockStatus = (currentStock, reorderPoint, safetyStock) => {
    if (currentStock <= safetyStock) return { color: 'red', text: 'Critical', icon: AlertTriangle }
    if (currentStock <= reorderPoint) return { color: 'yellow', text: 'Low', icon: TrendingDown }
    return { color: 'green', text: 'Good', icon: TrendingUp }
  }

  const stockStatus = getStockStatus(item.currentStock, item.reorderPoint, item.safetyStock)
  const StatusIcon = stockStatus.icon

  const handleEdit = () => {
    navigate(`/items/${id}/edit`)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      navigate('/items')
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/items')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Items</span>
        </button>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Package className="w-10 h-10 text-gray-400" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleEdit}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="btn btn-danger flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{item.currentStock}</div>
                <div className="text-sm text-gray-500">Current Stock</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <StatusIcon className={`w-5 h-5 text-${stockStatus.color}-500`} />
                  <span className={`text-lg font-semibold text-${stockStatus.color}-700`}>
                    {stockStatus.text}
                  </span>
                </div>
                <div className="text-sm text-gray-500">Stock Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">${item.cost}</div>
                <div className="text-sm text-gray-500">Unit Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">${item.sellingPrice}</div>
                <div className="text-sm text-gray-500">Selling Price</div>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['overview', 'stock', 'transactions', 'analytics'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                        <dd className="text-sm text-gray-900 max-w-xs text-right">{item.description}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Category</dt>
                        <dd className="text-sm text-gray-900">{item.category}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Unit of Measure</dt>
                        <dd className="text-sm text-gray-900">{item.unitOfMeasure}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {item.status}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Management</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Safety Stock</dt>
                        <dd className="text-sm text-gray-900">{item.safetyStock} {item.unitOfMeasure}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Reorder Point</dt>
                        <dd className="text-sm text-gray-900">{item.reorderPoint} {item.unitOfMeasure}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Max Stock</dt>
                        <dd className="text-sm text-gray-900">{item.maxStock} {item.unitOfMeasure}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Lead Time</dt>
                        <dd className="text-sm text-gray-900">{item.leadTime} days</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Location & Supplier</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Warehouse</dt>
                        <dd className="text-sm text-gray-900">{item.warehouse}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Location</dt>
                        <dd className="text-sm text-gray-900">{item.location}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Supplier</dt>
                        <dd className="text-sm text-gray-900">{item.supplier}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tracking Options</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Batch Tracking</dt>
                        <dd className="text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.batchTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.batchTracking ? 'Enabled' : 'Disabled'}
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Serial Tracking</dt>
                        <dd className="text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.serialTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.serialTracking ? 'Enabled' : 'Disabled'}
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Expiry Tracking</dt>
                        <dd className="text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.expiryTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.expiryTracking ? 'Enabled' : 'Disabled'}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stock' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Stock History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stockHistory.map((entry, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              entry.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.type === 'IN' ? '+' : '-'}{entry.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.reference}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.date).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.reference}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.user}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Analytics & Insights</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Stock Turnover</h4>
                    <div className="text-2xl font-bold text-gray-900">4.2x</div>
                    <div className="text-sm text-gray-500">per year</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Average Days in Stock</h4>
                    <div className="text-2xl font-bold text-gray-900">87</div>
                    <div className="text-sm text-gray-500">days</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Total Value</h4>
                    <div className="text-2xl font-bold text-gray-900">${item.currentStock * item.cost}</div>
                    <div className="text-sm text-gray-500">current stock value</div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Stock Level Trend (Last 30 Days)</h4>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <BarChart3 className="w-16 h-16" />
                    <span className="ml-4">Chart placeholder - Stock level visualization</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemDetails
