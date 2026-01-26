import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Search, Eye, Edit, CheckCircle, Clock, Package, Calendar, User, FileText, DollarSign, XCircle, X, Filter, Trash2 } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const PurchaseOrdersSimple = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role?.toLowerCase() === 'admin'
  const isInventoryManager = user?.role === 'Inventory Manager'
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [requisitions, setRequisitions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('orders')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPO, setEditingPO] = useState(null)
  const [editFormData, setEditFormData] = useState({
    status: '',
    notes: ''
  })
  const [suppliers, setSuppliers] = useState([])
  const [items, setItems] = useState([])
  const [formData, setFormData] = useState({
    po_number: '',
    supplier_name: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    payment_terms: 'Net 30',
    delivery_terms: 'FOB',
    notes: '',
    items: [{ name: '', quantity: 1, unit_price: 0, total: 0 }],
    total_amount: 0,
    currency: 'INR'
  })

  useEffect(() => {
    loadPurchaseOrders()
    loadRequisitions()
    loadSuppliers()
    loadItems()
    generatePONumber()
  }, [])

  useEffect(() => {
    console.log('showCreateModal changed:', showCreateModal)
  }, [showCreateModal])

  const loadPurchaseOrders = async () => {
    try {
      console.log('🔍 Loading purchase orders via api service...');
      const response = await api.get('/purchase-orders')
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      setPurchaseOrders(response.data)
    } catch (error) {
      console.error('Failed to load purchase orders:', error)
    }
  }

  const handleApproveRequisition = async (reqId) => {
    if (!isInventoryManager && !isAdmin) {
      alert('Only Inventory Managers can approve requisitions')
      return
    }

    try {
      await api.put(`/purchase-requisitions/${reqId}/approve`)
      setRequisitions(prev => prev.map(req =>
        req.id === reqId ? { ...req, status: 'INWARD_APPROVED', approved_at: new Date().toISOString() } : req
      ))
      alert('Requisition approved successfully')
    } catch (error) {
      console.error('Failed to approve requisition:', error)
      alert('Failed to approve requisition')
    }
  }

  const handleRejectRequisition = async (reqId) => {
    if (!isInventoryManager && !isAdmin) {
      alert('Only Inventory Managers can reject requisitions')
      return
    }

    const reason = prompt('Please enter the reason for rejection:')
    if (!reason) return

    try {
      await api.put(`/purchase-requisitions/${reqId}/reject`, { reason })
      setRequisitions(prev => prev.map(req =>
        req.id === reqId ? { ...req, status: 'REJECTED', rejection_reason: reason } : req
      ))
      alert('Requisition rejected successfully')
    } catch (error) {
      console.error('Failed to reject requisition:', error)
      alert('Failed to reject requisition')
    }
  }

  const handleDeleteRequisition = async (reqId) => {
    if (!window.confirm('Are you sure you want to delete this requisition?')) return

    try {
      await api.delete(`/purchase-requisitions/${reqId}`)
      setRequisitions(prev => prev.filter(req => req.id !== reqId))
      alert('Requisition deleted successfully')
    } catch (error) {
      console.error('Failed to delete requisition:', error)
      alert('Failed to delete requisition')
    }
  }

  const loadRequisitions = async () => {
    try {
      const response = await api.get('/purchase-requisitions')
      setRequisitions(response.data)
    } catch (error) {
      console.error('Failed to load purchase requisitions:', error)
    }
  }

  const loadSuppliers = async () => {
    try {
      console.log('🔍 Loading suppliers via api service...');
      const response = await api.get('/suppliers')
      console.log('Suppliers response:', response.data);
      setSuppliers(response.data)
    } catch (error) {
      console.error('Failed to load suppliers:', error)
    }
  }

  const loadItems = async () => {
    try {
      console.log('🔍 Loading inventory items via api service...');
      const response = await api.get('/inventory')
      console.log('Items response:', response.data);
      setItems(response.data)
    } catch (error) {
      console.error('Failed to load items:', error)
    }
  }

  const generatePONumber = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setFormData(prev => ({ ...prev, po_number: `PO-${year}-${random}` }))
  }

  const handleCreatePO = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/purchase-orders', formData)
      
      if (response.status === 201) {
        const newPO = response.data
        setPurchaseOrders(prev => [...prev, newPO])
        setShowCreateModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create purchase order:', error)
    }
  }

  const resetForm = () => {
    generatePONumber()
    setFormData({
      po_number: formData.po_number,
      supplier_name: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_date: '',
      payment_terms: 'Net 30',
      delivery_terms: 'FOB',
      notes: '',
      items: [{ name: '', quantity: 1, unit_price: 0, total: 0 }],
      total_amount: 0,
      currency: 'INR'
    })
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unit_price: 0, total: 0 }]
    }))
  }

  const removeItem = (index) => {
    setFormData(prev => {
      const newItems = prev.items.filter((_, i) => i !== index)
      const total = newItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      return {
        ...prev,
        items: newItems,
        total_amount: total
      }
    })
  }

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      
      // Calculate item total and overall total
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price
      const total = newItems.reduce((sum, item) => sum + item.total, 0)
      
      return {
        ...prev,
        items: newItems,
        total_amount: total
      }
    })
  }

  const handleViewDetails = (po) => {
    console.log('View PO details:', po)
    // TODO: Show PO details modal
    alert(`PO Details: ${po.po_number}\nSupplier: ${po.supplier_name}\nAmount: ₹${po.total_amount}`)
  }

  const handleEdit = (po) => {
    console.log('Edit PO:', po)
    setEditingPO(po)
    setEditFormData({
      status: po.status || '',
      notes: po.notes || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!isAdmin && editFormData.status === 'APPROVED') {
      alert('Only Admin can approve purchase orders')
      return
    }

    try {
      const response = await api.put(`/purchase-orders/${editingPO.id}`, editFormData)
      
      if (response.status === 200) {
        // Update local state
        setPurchaseOrders(prev => prev.map(po => 
          po.id === editingPO.id ? { ...po, ...editFormData } : po
        ))
        setShowEditModal(false)
        setEditingPO(null)
        alert('Purchase Order updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update PO:', error)
      alert('Failed to update Purchase Order')
    }
  }

  const handleEditCancel = () => {
    setShowEditModal(false)
    setEditingPO(null)
    setEditFormData({
      status: '',
      notes: ''
    })
  }

  const handleApprove = async (poId) => {
    if (!isAdmin) {
      alert('Only Admin can approve purchase orders')
      return
    }

    if (window.confirm('Are you sure you want to approve this Purchase Order?')) {
      try {
        const response = await api.put(`/purchase-orders/${poId}`, { status: 'APPROVED' })
        
        if (response.status === 200) {
          // Update local state
          setPurchaseOrders(prev => prev.map(po => 
            po.id === poId ? { ...po, status: 'APPROVED', approved_at: new Date().toISOString() } : po
          ))
          alert('Purchase Order approved successfully!')
        }
      } catch (error) {
        console.error('Failed to approve PO:', error)
        alert('Failed to approve Purchase Order')
      }
    }
  }

  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'DRAFT': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || po.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                <p className="text-sm text-gray-500">Simple purchase order management</p>
              </div>
            </div>
            <button
              onClick={() => {
                console.log('Create PO button clicked')
                setShowCreateModal(true)
              }}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create PO</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'orders' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Purchase Orders
            </button>
            <button
              onClick={() => setActiveTab('requisitions')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'requisitions' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Purchase Requisitions
            </button>
          </div>
        </div>

        {activeTab === 'requisitions' && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PR Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requisitions.length > 0 ? (
                    requisitions.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {req.pr_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {req.status}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {req.items?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => navigate('/purchasing/requisitions')}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Requisitions"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {req.status === 'PENDING' && (isInventoryManager || isAdmin) && (
                              <>
                                <button
                                  onClick={() => handleApproveRequisition(req.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Approve Requisition"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectRequisition(req.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Reject Requisition"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteRequisition(req.id)}
                              className="text-gray-600 hover:text-red-600"
                              title="Delete Requisition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No requisitions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search purchase orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 input-field"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="input-field"
                  >
                    <option value="all">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="APPROVED">Approved</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount (₹)
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
                  {filteredPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{po.po_number}</div>
                        <div className="text-sm text-gray-500">Created: {new Date(po.created_at).toLocaleDateString()}</div>
                        {po.approved_at && (
                          <div className="text-xs text-gray-400">Approved: {new Date(po.approved_at).toLocaleDateString()}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(po.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {po.expected_delivery_date 
                            ? new Date(po.expected_delivery_date).toLocaleDateString()
                            : 'Not Set'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{po.total_amount.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                          {getStatusIcon(po.status)}
                          <span className="ml-1">{po.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(po)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(po)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit PO"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {po.status === 'DRAFT' && isAdmin && (
                            <button
                              onClick={() => handleApprove(po.id)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Approve PO"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Create Purchase Order
              </h3>
              <form onSubmit={handleCreatePO} className="mt-4 space-y-6">
                {/* PO Header */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Purchase Order Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">PO Number</label>
                      <input
                        type="text"
                        value={formData.po_number}
                        className="mt-1 input-field bg-gray-100"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier *</label>
                      <select
                        value={formData.supplier_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                        className="mt-1 input-field"
                        required
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.name}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Order Date</label>
                      <input
                        type="date"
                        value={formData.order_date}
                        className="mt-1 input-field bg-gray-100"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expected Delivery Date *</label>
                      <input
                        type="date"
                        value={formData.expected_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, expected_date: e.target.value }))}
                        className="mt-1 input-field"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Items
                    </h4>
                    <button type="button" onClick={addItem} className="btn btn-secondary text-sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Description</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price (₹)</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total (₹)</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">
                              <select
                                value={item.id || ''}
                                onChange={(e) => updateItem(index, 'id', e.target.value)}
                                className="w-full input-field text-sm"
                                required
                              >
                                <option value="">Select Item</option>
                                {items.map(item => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-20 input-field text-sm"
                                min="1"
                                required
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-1">₹</span>
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  value={item.unit_price}
                                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                  className="w-20 input-field text-sm"
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-sm font-medium text-gray-900">
                                ₹{item.total.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {formData.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Terms and Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                    <select
                      value={formData.payment_terms}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                      className="mt-1 input-field"
                    >
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Terms</label>
                    <select
                      value={formData.delivery_terms}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery_terms: e.target.value }))}
                      className="mt-1 input-field"
                    >
                      <option value="EXW">EXW</option>
                      <option value="FOB">FOB</option>
                      <option value="CIF">CIF</option>
                      <option value="DDP">DDP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="mt-1 input-field w-full"
                    placeholder="Additional notes or instructions..."
                  />
                </div>

                {/* Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Total Amount:
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{formData.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <FileText className="w-4 h-4 mr-2" />
                    Create Purchase Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit PO Modal */}
      {showEditModal && editingPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Purchase Order</h2>
              <button
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">PO Number</label>
                  <input
                    type="text"
                    value={editingPO.po_number}
                    disabled
                    className="mt-1 input-field w-full bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="mt-1 input-field w-full"
                  >
                    <option value="DRAFT">Draft</option>
                    {isAdmin && <option value="APPROVED">Approved</option>}
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="mt-1 input-field w-full"
                    placeholder="Add notes about this purchase order..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchaseOrdersSimple
