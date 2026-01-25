import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Package, MapPin, Calendar, User, CheckCircle, XCircle, Clock, AlertTriangle, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const TransferOrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [transferOrder, setTransferOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  
  const [approvalData, setApprovalData] = useState({
    items_approval: [],
    comments: ''
  })
  
  const [rejectionData, setRejectionData] = useState({
    rejection_reason: ''
  })
  
  const [completionData, setCompletionData] = useState({
    items_completed: []
  })

  useEffect(() => {
    fetchTransferOrder()
  }, [id])

  const fetchTransferOrder = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/transfer-orders/${id}`)
      setTransferOrder(response.data)
      
      // Initialize approval data with items
      if (response.data.items) {
        setApprovalData(prev => ({
          ...prev,
          items_approval: response.data.items.map(item => ({
            inventory_id: item.item_id,
            quantity_approved: item.quantity_requested
          }))
        }))
        
        setCompletionData(prev => ({
          ...prev,
          items_completed: response.data.items.map(item => ({
            inventory_id: item.item_id,
            quantity_transferred: item.quantity_approved || item.quantity_requested
          }))
        }))
      }
    } catch (error) {
      console.error('Error fetching transfer order:', error)
      setError('Failed to load transfer order details')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      await api.put(`/transfer-orders/${id}/approve`, approvalData)
      setShowApprovalModal(false)
      fetchTransferOrder()
    } catch (error) {
      console.error('Error approving transfer order:', error)
      alert('Error approving transfer order: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleReject = async () => {
    if (!rejectionData.rejection_reason.trim()) {
      alert('Rejection reason is required')
      return
    }
    
    try {
      await api.put(`/transfer-orders/${id}/reject`, rejectionData)
      setShowRejectionModal(false)
      fetchTransferOrder()
    } catch (error) {
      console.error('Error rejecting transfer order:', error)
      alert('Error rejecting transfer order: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleStartTransfer = async () => {
    try {
      await api.put(`/transfer-orders/${id}/start`)
      fetchTransferOrder()
    } catch (error) {
      console.error('Error starting transfer:', error)
      alert('Error starting transfer: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleCompleteTransfer = async () => {
    try {
      await api.put(`/transfer-orders/${id}/complete`, completionData)
      setShowCompletionModal(false)
      fetchTransferOrder()
    } catch (error) {
      console.error('Error completing transfer:', error)
      alert('Error completing transfer: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleCancel = async () => {
    const reason = prompt('Please provide cancellation reason:')
    if (reason) {
      try {
        await api.put(`/transfer-orders/${id}/cancel`, { cancellation_reason: reason })
        fetchTransferOrder()
      } catch (error) {
        console.error('Error cancelling transfer order:', error)
        alert('Error cancelling transfer order: ' + (error.response?.data?.error || error.message))
      }
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-500" />
      case 'APPROVED': return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'IN_TRANSIT': return <Package className="w-5 h-5 text-purple-500" />
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'CANCELLED': return <XCircle className="w-5 h-5 text-red-500" />
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5 text-gray-500" />
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <div className="text-center text-gray-500">Loading transfer order details...</div>
      </div>
    )
  }

  if (error || !transferOrder) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <div className="text-center text-red-500">{error || 'Transfer order not found'}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/transfers')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Transfer Orders</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(transferOrder.status)}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{transferOrder.order_number}</h1>
                <p className="text-sm text-gray-500">Transfer Order Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transferOrder.status)}`}>
                {transferOrder.status_display || transferOrder.status}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(transferOrder.priority)}`}>
                {transferOrder.priority}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Transfer Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Transfer Route</div>
                      <div className="text-sm text-gray-500">
                        {transferOrder.from_warehouse_name} → {transferOrder.to_warehouse_name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Requested By</div>
                      <div className="text-sm text-gray-500">{transferOrder.requested_by_name}</div>
                      <div className="text-xs text-gray-400">{transferOrder.requested_by_email}</div>
                    </div>
                  </div>
                  
                  {transferOrder.approved_by_name && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Approved By</div>
                        <div className="text-sm text-gray-500">{transferOrder.approved_by_name}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Dates</div>
                      <div className="text-sm text-gray-500">
                        <div>Created: {new Date(transferOrder.created_at).toLocaleDateString()}</div>
                        {transferOrder.expected_transfer_date && (
                          <div>Expected: {new Date(transferOrder.expected_transfer_date).toLocaleDateString()}</div>
                        )}
                        {transferOrder.actual_transfer_date && (
                          <div>Actual Transfer: {new Date(transferOrder.actual_transfer_date).toLocaleDateString()}</div>
                        )}
                        {transferOrder.completed_at && (
                          <div>Completed: {new Date(transferOrder.completed_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Total Items</div>
                        <div className="text-2xl font-bold text-gray-900">{transferOrder.total_items || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Total Value</div>
                        <div className="text-2xl font-bold text-gray-900">${Number(transferOrder.total_value || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {transferOrder.is_overdue && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <div>
                          <div className="text-sm font-medium text-red-800">Overdue Transfer</div>
                          <div className="text-sm text-red-600">This transfer was expected on {new Date(transferOrder.expected_transfer_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transferred
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transferOrder.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                        {item.batch_number && (
                          <div className="text-xs text-gray-500">Batch: {item.batch_number}</div>
                        )}
                        {item.expiry_date && (
                          <div className="text-xs text-gray-500">Expiry: {new Date(item.expiry_date).toLocaleDateString()}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.item_sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity_requested}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity_approved || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity_transferred || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Number(item.unit_cost || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Number(item.total_cost || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {transferOrder.notes && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{transferOrder.notes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Last updated: {new Date(transferOrder.updated_at).toLocaleString()}
              </div>
              <div className="flex items-center space-x-3">
                {transferOrder.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => setShowApprovalModal(true)}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => setShowRejectionModal(true)}
                      className="btn btn-danger flex items-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </>
                )}
                
                {transferOrder.status === 'APPROVED' && (
                  <>
                    <button
                      onClick={handleStartTransfer}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <Package className="w-4 h-4" />
                      <span>Start Transfer</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn btn-danger flex items-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
                
                {transferOrder.status === 'IN_TRANSIT' && (
                  <button
                    onClick={() => setShowCompletionModal(true)}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Transfer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">Approve Transfer Order</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Item Approvals</h4>
                  <div className="space-y-3">
                    {approvalData.items_approval.map((item, index) => {
                      const originalItem = transferOrder.items?.find(i => i.item_id === item.inventory_id)
                      return (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{originalItem?.item_name}</div>
                            <div className="text-xs text-gray-500">Requested: {originalItem?.quantity_requested}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Approve Quantity</label>
                            <input
                              type="number"
                              min="0"
                              max={originalItem?.quantity_requested}
                              step="0.001"
                              value={item.quantity_approved}
                              onChange={(e) => {
                                const updatedItems = [...approvalData.items_approval]
                                updatedItems[index].quantity_approved = parseFloat(e.target.value)
                                setApprovalData(prev => ({ ...prev, items_approval: updatedItems }))
                              }}
                              className="w-24 input-field text-sm"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comments (Optional)</label>
                  <textarea
                    value={approvalData.comments}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, comments: e.target.value }))}
                    rows={3}
                    className="mt-1 input-field"
                    placeholder="Add any approval comments..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="btn btn-primary"
                >
                  Approve Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">Reject Transfer Order</h3>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Rejection Reason *</label>
                <textarea
                  value={rejectionData.rejection_reason}
                  onChange={(e) => setRejectionData(prev => ({ ...prev, rejection_reason: e.target.value }))}
                  rows={4}
                  className="mt-1 input-field"
                  placeholder="Please provide reason for rejection..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="btn btn-danger"
                >
                  Reject Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">Complete Transfer</h3>
              <div className="mt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Confirm Transferred Quantities</h4>
                <div className="space-y-3">
                  {completionData.items_completed.map((item, index) => {
                    const originalItem = transferOrder.items?.find(i => i.item_id === item.inventory_id)
                    return (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{originalItem?.item_name}</div>
                          <div className="text-xs text-gray-500">Approved: {originalItem?.quantity_approved}</div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Transferred Quantity</label>
                          <input
                            type="number"
                            min="0"
                            max={originalItem?.quantity_approved}
                            step="0.001"
                            value={item.quantity_transferred}
                            onChange={(e) => {
                              const updatedItems = [...completionData.items_completed]
                              updatedItems[index].quantity_transferred = parseFloat(e.target.value)
                              setCompletionData(prev => ({ ...prev, items_completed: updatedItems }))
                            }}
                            className="w-24 input-field text-sm"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteTransfer}
                  className="btn btn-primary"
                >
                  Complete Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransferOrderDetails
