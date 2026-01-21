import React, { useState, useEffect } from 'react'
import { Package, Plus, Search, Filter, Eye, Edit, Trash2, Calendar, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

const BatchTracking = () => {
  const [batches, setBatches] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [editingBatch, setEditingBatch] = useState(null)
  const [formData, setFormData] = useState({
    batchNumber: '',
    itemName: '',
    sku: '',
    quantity: 0,
    manufacturingDate: '',
    expiryDate: '',
    supplier: '',
    warehouse: '',
    location: '',
    status: 'Active',
    notes: ''
  })

  const warehouses = ['Warehouse A', 'Warehouse B', 'Warehouse C']

  useEffect(() => {
    // Mock data - replace with API call
    const mockBatches = [
      {
        id: 1,
        batchNumber: 'BATCH-001',
        itemName: 'Laptop Dell Latitude',
        sku: 'LAP-001',
        quantity: 50,
        originalQuantity: 50,
        manufacturingDate: '2024-01-01',
        expiryDate: '2026-12-31',
        supplier: 'Tech Supplies Inc',
        warehouse: 'Warehouse A',
        location: 'A-01-01',
        status: 'Active',
        qualityStatus: 'Good',
        remainingQuantity: 48,
        notes: 'Standard batch for Q1 deliveries',
        createdAt: '2024-01-01T09:00:00Z',
        lastUpdated: '2024-01-14T10:30:00Z'
      },
      {
        id: 2,
        batchNumber: 'BATCH-002',
        itemName: 'A4 Paper Pack',
        sku: 'PAP-002',
        quantity: 100,
        originalQuantity: 100,
        manufacturingDate: '2023-12-15',
        expiryDate: '2025-12-15',
        supplier: 'Office Depot',
        warehouse: 'Warehouse B',
        location: 'B-02-03',
        status: 'Active',
        qualityStatus: 'Good',
        remainingQuantity: 60,
        notes: 'Quarterly office supplies',
        createdAt: '2023-12-15T14:30:00Z',
        lastUpdated: '2024-01-13T15:45:00Z'
      },
      {
        id: 3,
        batchNumber: 'BATCH-003',
        itemName: 'Steel Rod 10mm',
        sku: 'RAW-003',
        quantity: 1000,
        originalQuantity: 1000,
        manufacturingDate: '2023-11-20',
        expiryDate: null,
        supplier: 'Metal Works Ltd',
        warehouse: 'Warehouse C',
        location: 'C-03-02',
        status: 'Active',
        qualityStatus: 'Good',
        remainingQuantity: 820,
        notes: 'Raw materials for production',
        createdAt: '2023-11-20T10:15:00Z',
        lastUpdated: '2024-01-12T09:20:00Z'
      },
      {
        id: 4,
        batchNumber: 'BATCH-004',
        itemName: 'Monitor 24 inch',
        sku: 'MON-002',
        quantity: 30,
        originalQuantity: 30,
        manufacturingDate: '2023-10-10',
        expiryDate: '2025-10-10',
        supplier: 'Tech Supplies Inc',
        warehouse: 'Warehouse A',
        location: 'A-02-01',
        status: 'Expiring Soon',
        qualityStatus: 'Good',
        remainingQuantity: 5,
        notes: 'Monitor batch - expiring in 9 months',
        createdAt: '2023-10-10T11:30:00Z',
        lastUpdated: '2024-01-10T16:45:00Z'
      },
      {
        id: 5,
        batchNumber: 'BATCH-005',
        itemName: 'Keyboard Wireless',
        sku: 'KEY-003',
        quantity: 25,
        originalQuantity: 25,
        manufacturingDate: '2023-09-05',
        expiryDate: '2024-06-30',
        supplier: 'Tech Supplies Inc',
        warehouse: 'Warehouse A',
        location: 'A-01-02',
        status: 'Expired',
        qualityStatus: 'Good',
        remainingQuantity: 0,
        notes: 'Expired batch - needs disposal',
        createdAt: '2023-09-05T13:20:00Z',
        lastUpdated: '2024-01-01T00:00:00Z'
      }
    ]
    setBatches(mockBatches)
  }, [])

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || batch.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingBatch) {
      setBatches(prev => prev.map(batch =>
        batch.id === editingBatch.id
          ? { ...batch, ...formData, lastUpdated: new Date().toISOString() }
          : batch
      ))
    } else {
      const newBatch = {
        id: batches.length + 1,
        ...formData,
        originalQuantity: formData.quantity,
        remainingQuantity: formData.quantity,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
      setBatches(prev => [...prev, newBatch])
    }
    setShowAddModal(false)
    setEditingBatch(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      batchNumber: '',
      itemName: '',
      sku: '',
      quantity: 0,
      manufacturingDate: '',
      expiryDate: '',
      supplier: '',
      warehouse: '',
      location: '',
      status: 'Active',
      notes: ''
    })
  }

  const handleEdit = (batch) => {
    setEditingBatch(batch)
    setFormData(batch)
    setShowAddModal(true)
  }

  const handleDelete = (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      setBatches(prev => prev.filter(batch => batch.id !== batchId))
    }
  }

  const handleViewDetails = (batch) => {
    setSelectedBatch(batch)
    setShowDetailsModal(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Expiring Soon': return 'bg-yellow-100 text-yellow-800'
      case 'Expired': return 'bg-red-100 text-red-800'
      case 'Quarantined': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { color: 'gray', text: 'No Expiry', icon: null }
    
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) return { color: 'red', text: 'Expired', icon: AlertTriangle }
    if (daysUntilExpiry <= 30) return { color: 'yellow', text: `${daysUntilExpiry} days`, icon: AlertTriangle }
    if (daysUntilExpiry <= 90) return { color: 'orange', text: `${daysUntilExpiry} days`, icon: TrendingUp }
    return { color: 'green', text: `${daysUntilExpiry} days`, icon: TrendingDown }
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Batch Tracking</h1>
                <p className="text-sm text-gray-500">Track and manage batch numbers for inventory items</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Batch</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search batches..."
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
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="Quarantined">Quarantined</option>
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
                  Batch Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
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
              {filteredBatches.map((batch) => {
                const expiryStatus = getExpiryStatus(batch.expiryDate)
                const ExpiryIcon = expiryStatus.icon
                
                return (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{batch.batchNumber}</div>
                        <div className="text-sm text-gray-500">{batch.supplier}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{batch.itemName}</div>
                        <div className="text-sm text-gray-500">{batch.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Original: {batch.originalQuantity}</div>
                        <div>Remaining: {batch.remainingQuantity}</div>
                        <div className="text-xs text-gray-500">
                          Used: {batch.originalQuantity - batch.remainingQuantity}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Manufactured: {batch.manufacturingDate}</div>
                        {batch.expiryDate && (
                          <div className="flex items-center space-x-2">
                            <span>Expires:</span>
                            {ExpiryIcon && <ExpiryIcon className={`w-4 h-4 text-${expiryStatus.color}-500`} />}
                            <span className={`text-${expiryStatus.color}-600`}>
                              {batch.expiryDate}
                            </span>
                            <span className={`text-xs text-${expiryStatus.color}-600`}>
                              ({expiryStatus.text})
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{batch.warehouse}</div>
                        <div className="text-sm text-gray-500">{batch.location}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(batch)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(batch)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(batch.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">
                {editingBatch ? 'Edit Batch' : 'Add New Batch'}
              </h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Batch Number *</label>
                    <input
                      type="text"
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Name *</label>
                    <input
                      type="text"
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU *</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Manufacturing Date *</label>
                    <input
                      type="date"
                      name="manufacturingDate"
                      value={formData.manufacturingDate}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier *</label>
                    <input
                      type="text"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warehouse *</label>
                    <select
                      name="warehouse"
                      value={formData.warehouse}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map(warehouse => (
                        <option key={warehouse} value={warehouse}>{warehouse}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      placeholder="e.g., A-01-01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    >
                      <option value="Active">Active</option>
                      <option value="Expiring Soon">Expiring Soon</option>
                      <option value="Expired">Expired</option>
                      <option value="Quarantined">Quarantined</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="input-field w-full"
                    placeholder="Any additional information about this batch..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingBatch(null)
                      resetForm()
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingBatch ? 'Update Batch' : 'Add Batch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedBatch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Batch Details: {selectedBatch.batchNumber}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <AlertTriangle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Batch Information</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedBatch.batchNumber}</p>
                  <p className="text-sm text-gray-600">{selectedBatch.supplier}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Item Details</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedBatch.itemName}</p>
                  <p className="text-sm text-gray-600">{selectedBatch.sku}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedBatch.status)}`}>
                    {selectedBatch.status}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">Quality: {selectedBatch.qualityStatus}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Quantity Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Original Quantity:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedBatch.originalQuantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Quantity:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedBatch.remainingQuantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Used Quantity:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedBatch.originalQuantity - selectedBatch.remainingQuantity}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Date Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Manufacturing Date:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedBatch.manufacturingDate}</span>
                    </div>
                    {selectedBatch.expiryDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expiry Date:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedBatch.expiryDate}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedBatch.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Notes</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{selectedBatch.notes}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button className="btn btn-primary">
                  Print Batch Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchTracking
