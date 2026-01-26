import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Search, Filter, Eye, Edit, CheckCircle, XCircle, Clock, Package, FileText, Truck, Trash2 } from 'lucide-react'
import { api } from '../../services/api'

const PurchaseOrders = () => {
  const navigate = useNavigate()
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [approvedRequisitions, setApprovedRequisitions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'approved', 'requisitions'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch actual purchase orders from backend
      const poResponse = await api.get('/purchase-orders')
      const actualPOs = poResponse.data.map(po => ({
        id: po.id,
        poNumber: po.po_number,
        prNumber: po.pr_id ? `PR-${po.pr_id}` : null,
        supplier: po.supplier_name,
        orderDate: new Date(po.created_at).toLocaleDateString(),
        expectedDate: po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        deliveryDate: null,
        status: po.status === 'APPROVED' ? 'Approved' : po.status === 'DRAFT' ? 'Draft' : po.status,
        approvedBy: po.approved_by || 'System',
        approvedDate: po.approved_at ? new Date(po.approved_at).toLocaleDateString() : null,
        totalAmount: po.total_amount || 0,
        currency: po.currency || 'INR',
        paymentTerms: 'Net 30',
        deliveryTerms: 'FOB',
        items: [] // Will be populated separately if needed
      }))
      
      // Fetch approved requisitions
      const reqResponse = await api.get('/purchase-requisitions')
      const approved = reqResponse.data.filter(req => req.status === 'INWARD_APPROVED' || req.status === 'approved')
      
      // Convert approved requisitions to PO format for display
      const convertedPOs = approved.map(req => ({
        id: `req-${req.id}`,
        poNumber: `PO-${req.pr_number || 'AUTO'}`,
        prNumber: req.pr_number,
        supplier: 'Auto-generated from PR',
        orderDate: new Date(req.created_at).toLocaleDateString(),
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        deliveryDate: null,
        status: 'Approved',
        approvedBy: 'System',
        approvedDate: new Date(req.approved_at || req.created_at).toLocaleDateString(),
        totalAmount: req.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0,
        currency: 'USD',
        paymentTerms: 'Net 30',
        deliveryTerms: 'FOB',
        items: req.items?.map(item => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice || 0,
          total: item.total || 0,
          received: 0,
          remaining: item.quantity
        })) || [],
        isFromRequisition: true
      }))
      
      setPurchaseOrders(actualPOs)
      setApprovedRequisitions(convertedPOs)
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredData = () => {
    let data = []
    
    if (activeTab === 'all') {
      data = [...purchaseOrders, ...approvedRequisitions]
    } else if (activeTab === 'approved') {
      data = [...purchaseOrders.filter(po => po.status === 'Approved'), ...approvedRequisitions]
    } else if (activeTab === 'requisitions') {
      data = approvedRequisitions
    }
    
    return data.filter(po => {
      const matchesSearch = po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (po.prNumber && po.prNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = selectedStatus === 'all' || po.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }

  const filteredPOs = getFilteredData()

  const handleViewDetails = (po) => {
    setSelectedPO(po)
    setShowDetailsModal(true)
  }

  const handleApprove = async (poId) => {
    try {
      // Call backend API to update status
      await api.put(`/purchase-orders/${poId}`, { status: 'Approved' })
      
      // Update local state after successful API call
      setPurchaseOrders(prev => prev.map(po =>
        po.id === poId
          ? { 
              ...po, 
              status: 'Approved', 
              approvedBy: 'Current User',
              approvedDate: new Date().toISOString().split('T')[0]
            }
          : po
      ))
    } catch (error) {
      console.error('Error approving purchase order:', error)
      alert('Failed to approve purchase order. Please try again.')
    }
  }

  const handleDelete = async (poId, poNumber) => {
    if (!window.confirm(`Are you sure you want to delete Purchase Order ${poNumber}? This action cannot be undone.`)) {
      return
    }

    try {
      await api.delete(`/purchase-orders/${poId}`)
      
      // Remove from local state after successful deletion
      setPurchaseOrders(prev => prev.filter(po => po.id !== poId))
      
      // Show success message
      alert(`Purchase Order ${poNumber} deleted successfully`)
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      alert(error.response?.data?.error || 'Failed to delete purchase order. Please try again.')
    }
  }

  const handleReceive = (po) => {
    // Navigate to GRN creation with PO reference
    if (po) {
      const poData = {
        po_number: po.poNumber,
        supplier_name: po.supplier,
        items: po.items || []
      }
      navigate(`/grn/create?po=${encodeURIComponent(po.poNumber)}`)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'Approved': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'Partially Received': return <Package className="w-4 h-4 text-purple-500" />
      case 'Received': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'Cancelled': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Approved': return 'bg-blue-100 text-blue-800'
      case 'Partially Received': return 'bg-purple-100 text-purple-800'
      case 'Received': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCompletionPercentage = (items) => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const receivedQuantity = items.reduce((sum, item) => sum + item.received, 0)
    return totalQuantity > 0 ? Math.round((receivedQuantity / totalQuantity) * 100) : 0
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                <p className="text-sm text-gray-500">Manage purchase orders and supplier deliveries</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/purchasing/orders/create')}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create PO</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          {/* Tabs */}
          <div className="mb-4">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => {
                    console.log('Setting active tab to all');
                    setActiveTab('all');
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All Orders
                </button>
                <button
                  onClick={() => {
                    console.log('Setting active tab to approved');
                    setActiveTab('approved');
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'approved'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Approved Only
                </button>
                <button
                  onClick={() => {
                    console.log('Setting active tab to requisitions');
                    setActiveTab('requisitions');
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'requisitions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  From Requisitions
                </button>
              </nav>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search purchase orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Filter className="w-4 h-4 mr-2" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
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
              {filteredPOs.map((po) => {
                const completionPercentage = getCompletionPercentage(po.items)
                
                return (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{po.poNumber}</div>
                        {po.prNumber && <div className="text-sm text-gray-500">PR: {po.prNumber}</div>}
                        {po.isFromRequisition && (
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">From Requisition</div>
                        )}
                        <div className="text-xs text-gray-400">{po.items?.length || 0} items</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Order: {po.orderDate}</div>
                        <div>Expected: {po.expectedDate}</div>
                        {po.deliveryDate && (
                          <div className="text-xs text-green-600">Delivered: {po.deliveryDate}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{po.totalAmount.toLocaleString('en-IN')} {po.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>{completionPercentage}%</span>
                            <span>{po.items.reduce((sum, item) => sum + item.received, 0)}/{po.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(po.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                          {po.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(po)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {po.status === 'Pending' && (
                          <button
                            onClick={() => handleApprove(po.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {(po.status === 'Approved' || po.status === 'Partially Received') && (
                          <button
                            onClick={() => handleReceive(po)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Create GRN"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {(po.status === 'Draft' || po.status === 'Cancelled') && (
                          <button
                            onClick={() => handleDelete(po.id, po.poNumber)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Purchase Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailsModal && selectedPO && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Purchase Order Details: {selectedPO.poNumber}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Supplier</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedPO.supplier}</p>
                  <p className="text-sm text-gray-600">{selectedPO.paymentTerms}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Total Amount</h4>
                  <p className="text-lg font-semibold text-gray-900">₹{selectedPO.totalAmount.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-gray-600">{selectedPO.currency}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Expected Delivery</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedPO.expectedDate}</p>
                  <p className="text-sm text-gray-600">Ordered: {selectedPO.orderDate}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedPO.status)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPO.status)}`}>
                      {selectedPO.status}
                    </span>
                  </div>
                  {selectedPO.approvedBy && (
                    <p className="text-sm text-gray-600 mt-1">by {selectedPO.approvedBy}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Order Items</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPO.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.sku}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.received}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.remaining}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{item.unitPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{item.total.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedPO.notes && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Notes</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedPO.notes}</p>
                  </div>
                </div>
              )}

              {selectedPO.attachments && selectedPO.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Attachments</h4>
                  <div className="space-y-2">
                    {selectedPO.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                        <FileText className="w-4 h-4" />
                        <span>{attachment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button className="btn btn-secondary flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Print PO</span>
                </button>
                {(selectedPO.status === 'Approved' || selectedPO.status === 'Partially Received') && (
                  <button
                    onClick={() => handleReceive(selectedPO)}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Create GRN</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchaseOrders
