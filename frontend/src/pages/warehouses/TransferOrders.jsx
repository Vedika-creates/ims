import React, { useState, useEffect } from 'react'
import { ArrowRight, Plus, Search, Filter, Package, MapPin, Calendar, User, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

const TransferOrders = () => {
  const [transferOrders, setTransferOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    fromWarehouse: '',
    toWarehouse: '',
    items: [],
    requestedBy: '',
    approvedBy: '',
    requestedDate: '',
    expectedDate: '',
    priority: 'Normal',
    notes: '',
    status: 'Pending'
  })

  const warehouses = ['Warehouse A', 'Warehouse B', 'Warehouse C']
  const priorities = ['Low', 'Normal', 'High', 'Urgent']
  const statuses = ['Pending', 'Approved', 'In Transit', 'Completed', 'Cancelled']

  useEffect(() => {
    // Mock data - replace with API call
    const mockTransferOrders = [
      {
        id: 1,
        orderNumber: 'TO-2024-001',
        fromWarehouse: 'Warehouse A',
        toWarehouse: 'Warehouse B',
        items: [
          { sku: 'LAP-001', name: 'Laptop Dell Latitude', quantity: 10, unit: 'Units' },
          { sku: 'PAP-002', name: 'A4 Paper Pack', quantity: 50, unit: 'Boxes' }
        ],
        requestedBy: 'John Smith',
        approvedBy: 'Jane Doe',
        requestedDate: '2024-01-14',
        expectedDate: '2024-01-16',
        actualDate: null,
        priority: 'High',
        status: 'In Transit',
        notes: 'Urgent transfer for customer order',
        createdAt: '2024-01-14T10:30:00Z'
      },
      {
        id: 2,
        orderNumber: 'TO-2024-002',
        fromWarehouse: 'Warehouse B',
        toWarehouse: 'Warehouse C',
        items: [
          { sku: 'RAW-003', name: 'Steel Rod 10mm', quantity: 100, unit: 'Meters' }
        ],
        requestedBy: 'Mike Johnson',
        approvedBy: '',
        requestedDate: '2024-01-13',
        expectedDate: '2024-01-18',
        actualDate: null,
        priority: 'Normal',
        status: 'Pending',
        notes: 'Stock replenishment',
        createdAt: '2024-01-13T14:20:00Z'
      },
      {
        id: 3,
        orderNumber: 'TO-2024-003',
        fromWarehouse: 'Warehouse C',
        toWarehouse: 'Warehouse A',
        items: [
          { sku: 'EQU-004', name: 'Power Drill', quantity: 5, unit: 'Units' }
        ],
        requestedBy: 'Sarah Wilson',
        approvedBy: 'John Smith',
        requestedDate: '2024-01-12',
        expectedDate: '2024-01-15',
        actualDate: '2024-01-14',
        priority: 'Low',
        status: 'Completed',
        notes: 'Equipment transfer',
        createdAt: '2024-01-12T09:15:00Z'
      }
    ]
    setTransferOrders(mockTransferOrders)
  }, [])

  const filteredOrders = transferOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.fromWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.toWarehouse.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newOrder = {
      id: transferOrders.length + 1,
      orderNumber: `TO-2024-${String(transferOrders.length + 1).padStart(3, '0')}`,
      ...formData,
      items: [], // Would be populated from item selection
      createdAt: new Date().toISOString()
    }
    setTransferOrders(prev => [...prev, newOrder])
    setShowAddModal(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      fromWarehouse: '',
      toWarehouse: '',
      items: [],
      requestedBy: '',
      approvedBy: '',
      requestedDate: '',
      expectedDate: '',
      priority: 'Normal',
      notes: '',
      status: 'Pending'
    })
  }

  const handleApprove = (orderId) => {
    setTransferOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, status: 'Approved', approvedBy: 'Current User' }
        : order
    ))
  }

  const handleCancel = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this transfer order?')) {
      setTransferOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: 'Cancelled' }
          : order
      ))
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'Approved': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'In Transit': return <Package className="w-4 h-4 text-purple-500" />
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'Cancelled': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Approved': return 'bg-blue-100 text-blue-800'
      case 'In Transit': return 'bg-purple-100 text-purple-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'bg-gray-100 text-gray-800'
      case 'Normal': return 'bg-blue-100 text-blue-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ArrowRight className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Transfer Orders</h1>
                <p className="text-sm text-gray-500">Manage stock transfers between warehouses</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Transfer</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transfer orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button className="btn btn-secondary flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfer Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">Requested by: {order.requestedBy}</div>
                      {order.approvedBy && (
                        <div className="text-xs text-gray-400">Approved by: {order.approvedBy}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-900">{order.fromWarehouse}</div>
                        <ArrowRight className="w-3 h-3 text-gray-400 mx-1" />
                        <div className="text-sm text-gray-900">{order.toWarehouse}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.items.slice(0, 2).map(item => item.name).join(', ')}
                      {order.items.length > 2 && '...'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Requested: {order.requestedDate}</div>
                      <div>Expected: {order.expectedDate}</div>
                      {order.actualDate && (
                        <div className="text-xs text-green-600">Completed: {order.actualDate}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {order.status === 'Pending' && (
                        <button
                          onClick={() => handleApprove(order.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {(order.status === 'Pending' || order.status === 'Approved') && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">Create Transfer Order</h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From Warehouse *</label>
                    <select
                      name="fromWarehouse"
                      value={formData.fromWarehouse}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    >
                      <option value="">Select Source Warehouse</option>
                      {warehouses.map(warehouse => (
                        <option key={warehouse} value={warehouse}>{warehouse}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">To Warehouse *</label>
                    <select
                      name="toWarehouse"
                      value={formData.toWarehouse}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    >
                      <option value="">Select Destination Warehouse</option>
                      {warehouses.filter(w => w !== formData.fromWarehouse).map(warehouse => (
                        <option key={warehouse} value={warehouse}>{warehouse}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Requested By *</label>
                    <input
                      type="text"
                      name="requestedBy"
                      value={formData.requestedBy}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Requested Date *</label>
                    <input
                      type="date"
                      name="requestedDate"
                      value={formData.requestedDate}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Date *</label>
                    <input
                      type="date"
                      name="expectedDate"
                      value={formData.expectedDate}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 input-field"
                      placeholder="Reason for transfer and any special instructions..."
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Items to Transfer</h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2" />
                    <p>Item selection interface would go here</p>
                    <p className="text-sm">Search and select items from source warehouse</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      resetForm()
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Transfer Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransferOrders
