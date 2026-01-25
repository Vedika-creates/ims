import React, { useState, useEffect } from 'react'
import { ArrowRight, Plus, Search, Filter, Package, MapPin, Calendar, User, CheckCircle, XCircle, Clock, AlertTriangle, Eye, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const TransferOrdersList = () => {
  const [transferOrders, setTransferOrders] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [inventory, setInventory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedFromWarehouse, setSelectedFromWarehouse] = useState('')
  const [selectedToWarehouse, setSelectedToWarehouse] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    priority: 'NORMAL',
    expected_transfer_date: '',
    notes: '',
    items: []
  })

  const priorities = [
    { value: 'LOW', label: 'Low' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' }
  ]

  const statuses = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'REJECTED', label: 'Rejected' }
  ]

  useEffect(() => {
    fetchTransferOrders()
    fetchWarehouses()
    fetchInventory()
  }, [pagination.page, selectedStatus, selectedFromWarehouse, selectedToWarehouse])

  const fetchTransferOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedFromWarehouse && { from_warehouse: selectedFromWarehouse }),
        ...(selectedToWarehouse && { to_warehouse: selectedToWarehouse })
      })
      
      const response = await api.get(`/transfer-orders?${params}`)
      setTransferOrders(response.data.data)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching transfer orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses')
      setWarehouses(response.data)
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory')
      setInventory(response.data)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    }
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { inventory_id: '', quantity_requested: 1, unit_cost: 0, notes: '' }]
    }))
  }

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/transfer-orders', formData)
      setShowAddModal(false)
      resetForm()
      fetchTransferOrders()
    } catch (error) {
      console.error('Error creating transfer order:', error)
      alert('Error creating transfer order: ' + (error.response?.data?.error || error.message))
    }
  }

  const resetForm = () => {
    setFormData({
      from_warehouse_id: '',
      to_warehouse_id: '',
      priority: 'NORMAL',
      expected_transfer_date: '',
      notes: '',
      items: []
    })
  }

  const handleApprove = async (orderId) => {
    try {
      await api.put(`/transfer-orders/${orderId}/approve`, {})
      fetchTransferOrders()
    } catch (error) {
      console.error('Error approving transfer order:', error)
      alert('Error approving transfer order: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleReject = async (orderId) => {
    const reason = prompt('Please provide rejection reason:')
    if (reason) {
      try {
        await api.put(`/transfer-orders/${orderId}/reject`, { rejection_reason: reason })
        fetchTransferOrders()
      } catch (error) {
        console.error('Error rejecting transfer order:', error)
        alert('Error rejecting transfer order: ' + (error.response?.data?.error || error.message))
      }
    }
  }

  const handleStartTransfer = async (orderId) => {
    try {
      await api.put(`/transfer-orders/${orderId}/start`)
      fetchTransferOrders()
    } catch (error) {
      console.error('Error starting transfer:', error)
      alert('Error starting transfer: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleCompleteTransfer = async (orderId) => {
    try {
      await api.put(`/transfer-orders/${orderId}/complete`, {})
      fetchTransferOrders()
    } catch (error) {
      console.error('Error completing transfer:', error)
      alert('Error completing transfer: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleCancel = async (orderId) => {
    const reason = prompt('Please provide cancellation reason:')
    if (reason) {
      try {
        await api.put(`/transfer-orders/${orderId}/cancel`, { cancellation_reason: reason })
        fetchTransferOrders()
      } catch (error) {
        console.error('Error cancelling transfer order:', error)
        alert('Error cancelling transfer order: ' + (error.response?.data?.error || error.message))
      }
    }
  }

  const viewOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/transfer-orders/${orderId}`)
      setSelectedOrder(response.data)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Error fetching order details:', error)
    }
  }

  const filteredOrders = transferOrders.filter(order => {
    const matchesSearch = order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.from_warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.to_warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'IN_TRANSIT': return <Package className="w-4 h-4 text-purple-500" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-red-500" />
      case 'REJECTED': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-blue-100 text-blue-800'
      case 'IN_TRANSIT': return 'bg-purple-100 text-purple-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800'
      case 'NORMAL': return 'bg-blue-100 text-blue-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
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
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            <select
              value={selectedFromWarehouse}
              onChange={(e) => setSelectedFromWarehouse(e.target.value)}
              className="input-field"
            >
              <option value="">From Warehouse</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
            <select
              value={selectedToWarehouse}
              onChange={(e) => setSelectedToWarehouse(e.target.value)}
              className="input-field"
            >
              <option value="">To Warehouse</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
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
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No transfer orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                        <div className="text-sm text-gray-500">Requested by: {order.requested_by_name}</div>
                        {order.approved_by_name && (
                          <div className="text-xs text-gray-400">Approved by: {order.approved_by_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-900">{order.from_warehouse_name}</div>
                          <ArrowRight className="w-3 h-3 text-gray-400 mx-1" />
                          <div className="text-sm text-gray-900">{order.to_warehouse_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.total_items || 0} item{(order.total_items || 0) !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        Value: ${Number(order.total_value || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Created: {new Date(order.created_at).toLocaleDateString()}</div>
                        {order.expected_transfer_date && (
                          <div>Expected: {new Date(order.expected_transfer_date).toLocaleDateString()}</div>
                        )}
                        {order.is_overdue && (
                          <div className="text-xs text-red-600 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Overdue
                          </div>
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
                          {order.status_display || order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => viewOrderDetails(order.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {order.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(order.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(order.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {order.status === 'APPROVED' && (
                          <>
                            <button
                              onClick={() => handleStartTransfer(order.id)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancel(order.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {order.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => handleCompleteTransfer(order.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Transfer Order Modal */}
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
                      name="from_warehouse_id"
                      value={formData.from_warehouse_id}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    >
                      <option value="">Select Source Warehouse</option>
                      {warehouses.map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">To Warehouse *</label>
                    <select
                      name="to_warehouse_id"
                      value={formData.to_warehouse_id}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    >
                      <option value="">Select Destination Warehouse</option>
                      {warehouses.filter(w => w.id !== formData.from_warehouse_id).map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                      ))}
                    </select>
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
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Transfer Date *</label>
                    <input
                      type="date"
                      name="expected_transfer_date"
                      value={formData.expected_transfer_date}
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
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">Items to Transfer</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="btn btn-secondary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Item</span>
                    </button>
                  </div>
                  
                  {formData.items.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2" />
                      <p>No items added yet</p>
                      <p className="text-sm">Click "Add Item" to add items to transfer</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Item *</label>
                              <select
                                value={item.inventory_id}
                                onChange={(e) => handleItemChange(index, 'inventory_id', e.target.value)}
                                className="mt-1 input-field"
                                required
                              >
                                <option value="">Select Item</option>
                                {inventory.map(inv => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.name} ({inv.sku}) - Stock: {inv.current_stock}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                              <input
                                type="number"
                                min="1"
                                step="0.001"
                                value={item.quantity_requested}
                                onChange={(e) => handleItemChange(index, 'quantity_requested', parseFloat(e.target.value))}
                                className="mt-1 input-field"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Unit Cost</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_cost}
                                onChange={(e) => handleItemChange(index, 'unit_cost', parseFloat(e.target.value))}
                                className="mt-1 input-field"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="btn btn-danger"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="Item notes (optional)"
                              value={item.notes}
                              onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                              className="input-field"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={formData.items.length === 0}
                  >
                    Create Transfer Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Transfer Order Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Order Information</h4>
                    <div className="mt-2 space-y-2">
                      <div><strong>Order Number:</strong> {selectedOrder.order_number}</div>
                      <div><strong>Status:</strong> {selectedOrder.status_display}</div>
                      <div><strong>Priority:</strong> {selectedOrder.priority}</div>
                      <div><strong>Created:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Transfer Details</h4>
                    <div className="mt-2 space-y-2">
                      <div><strong>From:</strong> {selectedOrder.from_warehouse_name}</div>
                      <div><strong>To:</strong> {selectedOrder.to_warehouse_name}</div>
                      <div><strong>Requested by:</strong> {selectedOrder.requested_by_name}</div>
                      {selectedOrder.approved_by_name && (
                        <div><strong>Approved by:</strong> {selectedOrder.approved_by_name}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Items</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Transferred</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items?.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{item.item_name}</td>
                            <td className="px-4 py-2 text-sm">{item.item_sku}</td>
                            <td className="px-4 py-2 text-sm">{item.quantity_requested}</td>
                            <td className="px-4 py-2 text-sm">{item.quantity_approved || '-'}</td>
                            <td className="px-4 py-2 text-sm">{item.quantity_transferred || '-'}</td>
                            <td className="px-4 py-2 text-sm">${Number(item.unit_cost || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm">${Number(item.total_cost || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                    <p className="mt-2 text-sm text-gray-700">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransferOrdersList
