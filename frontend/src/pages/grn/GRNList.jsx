import React, { useState, useEffect } from 'react'
import { Package, Plus, Search, Filter, Eye, Edit, CheckCircle, XCircle, Clock, AlertTriangle, FileText } from 'lucide-react'

const API_URL = 'https://ims-0i8n.onrender.com/api'

const GRNList = () => {
  const [grns, setGrns] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedGRN, setSelectedGRN] = useState(null)

  useEffect(() => {
    // Load real GRN data from API
    const loadGRNs = async () => {
      try {
        const response = await fetch(`${API_URL}/grn`)
        const data = await response.json()
        setGrns(data)
      } catch (error) {
        console.error('Failed to load GRNs:', error)
        // Fallback to mock data if API fails
        const mockGRNs = [
          {
            id: 1,
            grnNumber: 'GRN-2024-001',
            poNumber: 'PO-2024-015',
            supplier: 'Tech Supplies Inc',
            receivedDate: '2024-01-14',
            receivedBy: 'John Smith',
            status: 'Completed',
            totalItems: 3,
            totalQuantity: 85,
            totalValue: 25000,
            currency: 'INR',
            notes: '2 laptops damaged in transit, supplier notified',
            createdAt: '2024-01-14T10:30:00Z'
          },
          {
            id: 2,
            grnNumber: 'GRN-2024-002',
            poNumber: 'PO-2024-016',
            supplier: 'Office Depot',
            receivedDate: '2024-01-13',
            receivedBy: 'Jane Doe',
            status: 'Completed',
            totalItems: 2,
            totalQuantity: 150,
            totalValue: 3750,
            currency: 'INR',
            notes: 'All items received in good condition',
            createdAt: '2024-01-13T14:20:00Z'
          },
          {
            id: 3,
            grnNumber: 'GRN-2024-003',
            poNumber: 'PO-2024-017',
            supplier: 'Metal Works Ltd',
            receivedDate: null,
            expectedDate: '2024-01-15',
            receivedBy: null,
            status: 'Pending',
            totalItems: 1,
            totalQuantity: 0,
            totalValue: 5000,
            items: [
              {
                sku: 'RAW-003',
                name: 'Steel Rod 10mm',
                poQuantity: 1000,
                receivedQuantity: 0,
                acceptedQuantity: 0,
                rejectedQuantity: 0,
                unitPrice: 5,
                batchNumber: null,
                expiryDate: null,
                serialNumbers: []
              }
            ],
            notes: 'Expected delivery tomorrow',
            createdAt: '2024-01-12T09:15:00Z'
          }
        ];
        setGrns(mockGRNs)
      }
    }
    
    loadGRNs()
  }, [])

  const filteredGRNs = grns.filter(grn => {
    const matchesSearch = (grn.grn_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (grn.po_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (grn.supplier || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || grn.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const handleViewDetails = (grn) => {
    setSelectedGRN(grn)
    setShowDetailsModal(true)
  }

  const handleQuickStatusUpdate = async (grn, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/grn/${grn.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        // Update the GRN in the local state
        setGrns(prevGRNs => 
          prevGRNs.map(g => g.id === grn.id ? { ...g, status: newStatus } : g)
        )
        alert(`GRN ${grn.grn_number} status updated to ${newStatus}`)
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Failed to update GRN status:', error)
      alert('Failed to update GRN status')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DRAFT': return <Clock className="w-4 h-4 text-gray-500" />
      case 'VERIFIED': return <Package className="w-4 h-4 text-blue-500" />
      case 'POSTED': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'In Progress': return <Package className="w-4 h-4 text-blue-500" />
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Goods Receipt Notes</h1>
                <p className="text-sm text-gray-500">Manage incoming inventory and putaway processes</p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/grn/create'}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create GRN</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search GRNs..."
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
              <option value="DRAFT">Draft</option>
              <option value="VERIFIED">Verified</option>
              <option value="POSTED">Posted</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
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
                  GRN Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
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
              {filteredGRNs.map((grn) => (
                <tr key={grn.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{grn.grn_number}</div>
                      <div className="text-sm text-gray-500">PO: {grn.po_number}</div>
                      {grn.received_by && (
                        <div className="text-xs text-gray-400">Received by: {grn.received_by}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {grn.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {grn.total_items} item{grn.total_items !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-500">
                      {grn.total_quantity} units total
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Received: {formatDate(grn.received_date)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{grn.total_value.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(grn.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(grn.status)}`}>
                        {grn.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(grn)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* Status update buttons for DRAFT GRNs */}
                      {grn.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => handleQuickStatusUpdate(grn, 'VERIFIED')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Verify GRN"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleQuickStatusUpdate(grn, 'POSTED')}
                            className="text-green-600 hover:text-green-900"
                            title="Post GRN"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {/* Status update button for VERIFIED GRNs */}
                      {grn.status === 'VERIFIED' && (
                        <button
                          onClick={() => handleQuickStatusUpdate(grn, 'POSTED')}
                          className="text-green-600 hover:text-green-900"
                          title="Post GRN"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Edit button for Pending GRNs */}
                      {grn.status === 'Pending' && (
                        <button
                          onClick={() => window.location.href = `/grn/create?po=${grn.po_number}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit GRN"
                        >
                          <Edit className="w-4 h-4" />
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

      {showDetailsModal && selectedGRN && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">GRN Details: {selectedGRN.grnNumber}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Purchase Order</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedGRN.poNumber}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Supplier</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedGRN.supplier}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Total Value</h4>
                  <p className="text-lg font-semibold text-gray-900">${selectedGRN.totalValue.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedGRN.status)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedGRN.status)}`}>
                      {selectedGRN.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Items Received</h4>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedGRN.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.sku}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.poQuantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.receivedQuantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.acceptedQuantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.rejectedQuantity > 0 && (
                              <span className="text-red-600 font-medium">{item.rejectedQuantity}</span>
                            )}
                            {item.rejectedQuantity === 0 && '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${item.unitPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              {item.batchNumber && (
                                <div className="text-xs">Batch: {item.batchNumber}</div>
                              )}
                              {item.expiryDate && (
                                <div className="text-xs">Expiry: {item.expiryDate}</div>
                              )}
                              {item.serialNumbers && item.serialNumbers.length > 0 && (
                                <div className="text-xs">Serials: {item.serialNumbers.length} units</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedGRN.notes && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Notes</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedGRN.notes}</p>
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
                <button className="btn btn-primary flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Print GRN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GRNList
