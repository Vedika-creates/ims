import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Package, ArrowLeft, Eye, Edit, Trash2, Calendar, User, MapPin, FileText, Truck } from 'lucide-react'
import { api } from '../../services/api'

const GRNDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [grn, setGrn] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const loadGRN = async () => {
      try {
        console.log('🔍 Loading GRN details for ID:', id)
        const response = await api.get(`/grn/${id}`)
        console.log('GRN response:', response.data)
        setGrn(response.data)
        setIsEditing(false) // Reset edit mode when loading new data
      } catch (error) {
        console.error('Failed to load GRN:', error)
      }
    }

    if (id) {
      loadGRN()
    }
  }, [id])

  const handleUpdate = async (field, value) => {
    if (!isEditing) {
      console.log('⚠️ Cannot update: not in edit mode')
      return
    }
    
    try {
      console.log('📝 Updating GRN field:', field, 'to:', value)
      const response = await api.put(`/grn/${id}`, { [field]: value })
      console.log('Update response:', response.data)
      setGrn(response.data)
    } catch (error) {
      console.error('Failed to update GRN:', error)
      alert('Failed to update GRN')
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      console.log('🔄 Updating GRN status to:', newStatus)
      const response = await api.put(`/grn/${id}`, { status: newStatus })
      console.log('Status update response:', response.data)
      setGrn(response.data)
      alert(`GRN status updated to ${newStatus}`)
    } catch (error) {
      console.error('Failed to update GRN status:', error)
      alert('Failed to update GRN status')
    }
  }

  const handleSave = async () => {
    try {
      console.log('💾 Saving GRN:', grn)
      const response = await api.put(`/grn/${id}`, grn)
      console.log('Save response:', response.data)
      setGrn(response.data)
      setIsEditing(false)
      alert('GRN updated successfully!')
    } catch (error) {
      console.error('Failed to save GRN:', error)
      alert('Failed to save GRN')
    }
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...grn.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'receivedQuantity' || field === 'acceptedQuantity' || field === 'rejectedQuantity' 
        ? parseInt(value) || 0 
        : value || ''
    }
    setGrn(prev => ({ ...prev, items: updatedItems }))
  }

  const handleSerialNumber = (itemIndex, serialIndex) => {
    const updatedItems = [...grn.items]
    const serialNumbers = [...(updatedItems[itemIndex].serialNumbers || [])]
    serialNumbers.splice(serialIndex, 1)
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      serialNumbers
    }
    setGrn(prev => ({ ...prev, items: updatedItems }))
  }

  const handleEdit = () => {
    navigate(`/grn/${id}/edit`)
  }

  const handleCancel = () => {
    if (isEditing) {
      // Reset to original data when canceling
      loadGRN()
      setIsEditing(false)
    }
  }

  if (!grn) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'VERIFIED': return 'bg-blue-100 text-blue-800'
      case 'POSTED': return 'bg-green-100 text-green-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/grn')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GRNs</span>
        </button>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="w-8 h-8 text-gray-400" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">GRN Details</h1>
                  <p className="text-sm text-gray-500">{grn.grnNumber}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePrint}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleEdit}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['overview', 'items', 'attachments'].map((tab) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">GRN Number</h4>
                    <p className="text-lg font-semibold text-gray-900">{grn.grnNumber}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Purchase Order</h4>
                    <p className="text-lg font-semibold text-gray-900">{grn.poNumber}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Supplier</h4>
                    <p className="text-lg font-semibold text-gray-900">{grn.supplier}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(grn.status)}`}>
                        {grn.status}
                      </span>
                      {grn.status === 'DRAFT' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleStatusUpdate('VERIFIED')}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleStatusUpdate('POSTED')}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                          >
                            Post
                          </button>
                        </div>
                      )}
                      {grn.status === 'VERIFIED' && (
                        <button
                          onClick={() => handleStatusUpdate('POSTED')}
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                          Post
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Received Date</h4>
                    <p className="text-lg font-semibold text-gray-900">{grn.receivedDate}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Expected Date</h4>
                    <p className="text-lg font-semibold text-gray-900">{grn.expectedDate}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Received By</h4>
                    <p className="text-lg font-semibold text-gray-900">{grn.receivedBy}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Total Items</h4>
                    <p className="text-lg font-semibold text-gray-900">{grn.totalItems}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Total Quantity</h4>
                    <p className="text-lg font-semibold text-gray-900">{grn.totalQuantity}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Total Value</h4>
                    <p className="text-lg font-semibold text-gray-900">${grn.totalValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Created</h4>
                    <p className="text-lg font-semibold text-gray-900">{new Date(grn.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Warehouse</h4>
                    <p className="text-lg font-semibold text-gray-900">Warehouse A</p>
                  </div>
                </div>

                {grn.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                    <p className="text-sm text-gray-700">{grn.notes}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'items' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Received Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accepted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch/Serial</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {grn.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.sku}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="number"
                                value={item.receivedQuantity}
                                onChange={(e) => handleItemChange(index, 'receivedQuantity', e.target.value)}
                                className="w-20 input-field text-sm"
                                min="0"
                              />
                            ) : (
                              <span className="text-gray-900">{item.receivedQuantity}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="number"
                                value={item.acceptedQuantity}
                                onChange={(e) => handleItemChange(index, 'acceptedQuantity', e.target.value)}
                                className="w-20 input-field text-sm"
                                min="0"
                              />
                            ) : (
                              <span className="text-gray-900">{item.acceptedQuantity}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="number"
                                value={item.rejectedQuantity}
                                onChange={(e) => handleItemChange(index, 'rejectedQuantity', e.target.value)}
                                className="w-20 input-field text-sm"
                                min="0"
                              />
                            ) : (
                              <span className="text-gray-900">{item.rejectedQuantity}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <input
                              type="text"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              className="w-32 input-field text-sm"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={item.batchNumber}
                                onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)}
                                className="w-24 input-field text-sm"
                                placeholder="Batch #"
                              />
                            ) : (
                              <span className="text-gray-900">{item.batchNumber}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="date"
                                value={item.expiryDate}
                                onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                                className="w-32 input-field text-sm"
                              />
                            ) : (
                              <span className="text-gray-900">{item.expiryDate}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={item.serialNumbers.join(', ')}
                                onChange={(e) => handleSerialNumber(index, 'serialNumbers', e.target.value)}
                                className="w-32 input-field text-sm"
                                placeholder="Serial numbers (comma separated)"
                              />
                            ) : (
                              <span className="text-gray-900">{item.serialNumbers.join(', ')}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => removeSerialNumber(index, serialIndex)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
                <div className="space-y-3">
                  {grn.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{attachment}</div>
                          <div className="text-sm text-gray-500">GRN attachment</div>
                        </div>
                      </div>
                      <button className="btn btn-secondary">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GRNDetails
