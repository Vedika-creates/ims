import React, { useState, useEffect } from 'react'
import { Hash, Plus, Search, Filter, Eye, Edit, Trash2, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

const SerialTracking = () => {
  const [serialNumbers, setSerialNumbers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedSerial, setSelectedSerial] = useState(null)
  const [formData, setFormData] = useState({
    serialNumber: '',
    itemName: '',
    sku: '',
    batchNumber: '',
    status: 'Available',
    warehouse: '',
    location: '',
    purchaseOrder: '',
    grnNumber: '',
    warrantyExpiry: '',
    notes: ''
  })

  const warehouses = ['Warehouse A', 'Warehouse B', 'Warehouse C']
  const statuses = ['Available', 'In Use', 'Reserved', 'Sold', 'Damaged', 'Lost', 'Returned']

  useEffect(() => {
    // Mock data - replace with API call
    const mockSerialNumbers = [
      {
        id: 1,
        serialNumber: 'SN001',
        itemName: 'Laptop Dell Latitude',
        sku: 'LAP-001',
        batchNumber: 'BATCH-001',
        status: 'Available',
        warehouse: 'Warehouse A',
        location: 'A-01-01',
        purchaseOrder: 'PO-2024-015',
        grnNumber: 'GRN-2024-001',
        warrantyExpiry: '2026-12-31',
        notes: 'New laptop for Q1 hires',
        createdAt: '2024-01-14T10:30:00Z',
        lastUpdated: '2024-01-14T10:30:00Z'
      },
      {
        id: 2,
        serialNumber: 'SN002',
        itemName: 'Laptop Dell Latitude',
        sku: 'LAP-001',
        batchNumber: 'BATCH-001',
        status: 'In Use',
        warehouse: 'Warehouse A',
        location: 'Assigned to John Doe',
        purchaseOrder: 'PO-2024-015',
        grnNumber: 'GRN-2024-001',
        warrantyExpiry: '2026-12-31',
        notes: 'Assigned to development team',
        createdAt: '2024-01-14T10:30:00Z',
        lastUpdated: '2024-01-15T09:00:00Z'
      },
      {
        id: 3,
        serialNumber: 'SN003',
        itemName: 'Laptop Dell Latitude',
        sku: 'LAP-001',
        batchNumber: 'BATCH-001',
        status: 'Reserved',
        warehouse: 'Warehouse A',
        location: 'A-01-01',
        purchaseOrder: 'PO-2024-015',
        grnNumber: 'GRN-2024-001',
        warrantyExpiry: '2026-12-31',
        notes: 'Reserved for upcoming project',
        createdAt: '2024-01-14T10:30:00Z',
        lastUpdated: '2024-01-16T14:30:00Z'
      },
      {
        id: 4,
        serialNumber: 'SN004',
        itemName: 'Monitor 24 inch',
        sku: 'MON-002',
        batchNumber: 'BATCH-004',
        status: 'Sold',
        warehouse: 'Warehouse A',
        location: 'Delivered to Customer',
        purchaseOrder: 'PO-2024-018',
        grnNumber: 'GRN-2024-003',
        warrantyExpiry: '2025-10-10',
        notes: 'Sold to ABC Corporation',
        createdAt: '2023-10-10T11:30:00Z',
        lastUpdated: '2024-01-10T16:45:00Z'
      },
      {
        id: 5,
        serialNumber: 'SN005',
        itemName: 'Keyboard Wireless',
        sku: 'KEY-003',
        batchNumber: 'BATCH-005',
        status: 'Damaged',
        warehouse: 'Warehouse A',
        location: 'A-01-02',
        purchaseOrder: 'PO-2023-098',
        grnNumber: 'GRN-2023-045',
        warrantyExpiry: '2024-06-30',
        notes: 'Damaged during transit - needs repair',
        createdAt: '2023-09-05T13:20:00Z',
        lastUpdated: '2024-01-01T00:00:00Z'
      },
      {
        id: 6,
        serialNumber: 'SN006',
        itemName: 'Monitor 24 inch',
        sku: 'MON-002',
        batchNumber: 'BATCH-004',
        status: 'Lost',
        warehouse: 'Warehouse A',
        location: 'Unknown',
        purchaseOrder: 'PO-2023-098',
        grnNumber: 'GRN-2023-045',
        warrantyExpiry: '2025-10-10',
        notes: 'Lost during delivery - insurance claim filed',
        createdAt: '2023-10-10T11:30:00Z',
        lastUpdated: '2023-11-15T10:00:00Z'
      }
    ]
    setSerialNumbers(mockSerialNumbers)
  }, [])

  const filteredSerialNumbers = serialNumbers.filter(serial => {
    const matchesSearch = serial.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         serial.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         serial.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || serial.status === selectedStatus
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
    const newSerial = {
      id: serialNumbers.length + 1,
      ...formData,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
    setSerialNumbers(prev => [...prev, newSerial])
    setShowAddModal(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      serialNumber: '',
      itemName: '',
      sku: '',
      batchNumber: '',
      status: 'Available',
      warehouse: '',
      location: '',
      purchaseOrder: '',
      grnNumber: '',
      warrantyExpiry: '',
      notes: ''
    })
  }

  const handleEdit = (serial) => {
    setFormData(serial)
    setShowAddModal(true)
  }

  const handleDelete = (serialId) => {
    if (window.confirm('Are you sure you want to delete this serial number record?')) {
      setSerialNumbers(prev => prev.filter(serial => serial.id !== serialId))
    }
  }

  const handleViewDetails = (serial) => {
    setSelectedSerial(serial)
    setShowDetailsModal(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800'
      case 'In Use': return 'bg-blue-100 text-blue-800'
      case 'Reserved': return 'bg-yellow-100 text-yellow-800'
      case 'Sold': return 'bg-purple-100 text-purple-800'
      case 'Damaged': return 'bg-red-100 text-red-800'
      case 'Lost': return 'bg-gray-100 text-gray-800'
      case 'Returned': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'In Use': return <Package className="w-4 h-4 text-blue-500" />
      case 'Reserved': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'Sold': return <CheckCircle className="w-4 h-4 text-purple-500" />
      case 'Damaged': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'Lost': return <AlertTriangle className="w-4 h-4 text-gray-500" />
      case 'Returned': return <Package className="w-4 h-4 text-orange-500" />
      default: return <Hash className="w-4 h-4 text-gray-500" />
    }
  }

  const getWarrantyStatus = (expiryDate) => {
    if (!expiryDate) return { color: 'gray', text: 'No Warranty', icon: null }
    
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) return { color: 'red', text: 'Expired', icon: AlertTriangle }
    if (daysUntilExpiry <= 30) return { color: 'yellow', text: `${daysUntilExpiry} days`, icon: AlertTriangle }
    if (daysUntilExpiry <= 90) return { color: 'orange', text: `${daysUntilExpiry} days`, icon: Clock }
    return { color: 'green', text: `${daysUntilExpiry} days`, icon: CheckCircle }
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Hash className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Serial Number Tracking</h1>
                <p className="text-sm text-gray-500">Track individual items by serial number</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Serial</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search serial numbers..."
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
                  Serial Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warranty
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
              {filteredSerialNumbers.map((serial) => {
                const warrantyStatus = getWarrantyStatus(serial.warrantyExpiry)
                const WarrantyIcon = warrantyStatus.icon
                
                return (
                  <tr key={serial.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{serial.serialNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{serial.itemName}</div>
                        <div className="text-sm text-gray-500">{serial.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {serial.batchNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{serial.warehouse}</div>
                        <div className="text-sm text-gray-500">{serial.location}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {WarrantyIcon && <WarrantyIcon className={`w-4 h-4 text-${warrantyStatus.color}-500`} />}
                        <div>
                          <div className={`text-sm font-medium text-${warrantyStatus.color}-700`}>
                            {warrantyStatus.text}
                          </div>
                          <div className="text-xs text-gray-500">
                            {serial.warrantyExpiry}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(serial.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(serial.status)}`}>
                          {serial.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(serial)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(serial)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(serial.id)}
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
              <h3 className="text-lg font-medium text-gray-900">Add New Serial Number</h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Serial Number *</label>
                    <input
                      type="text"
                      name="serialNumber"
                      value={formData.serialNumber}
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
                    <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                    <input
                      type="text"
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
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
                    <label className="block text-sm font-medium text-gray-700">Purchase Order</label>
                    <input
                      type="text"
                      name="purchaseOrder"
                      value={formData.purchaseOrder}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">GRN Number</label>
                    <input
                      type="text"
                      name="grnNumber"
                      value={formData.grnNumber}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warranty Expiry</label>
                    <input
                      type="date"
                      name="warrantyExpiry"
                      value={formData.warrantyExpiry}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
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
                    placeholder="Any additional information about this serial number..."
                  />
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
                    Add Serial Number
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedSerial && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Serial Number Details: {selectedSerial.serialNumber}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <Hash className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Serial Information</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedSerial.serialNumber}</p>
                  <p className="text-sm text-gray-600">Status: {selectedSerial.status}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Item Details</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedSerial.itemName}</p>
                  <p className="text-sm text-gray-600">{selectedSerial.sku}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedSerial.warehouse}</p>
                  <p className="text-sm text-gray-600">{selectedSerial.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Tracking Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Batch Number:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSerial.batchNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Purchase Order:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSerial.purchaseOrder}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">GRN Number:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSerial.grnNumber}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Warranty Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Warranty Expiry:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSerial.warrantyExpiry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedSerial.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedSerial.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Notes</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{selectedSerial.notes}</p>
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
                  Print Serial Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SerialTracking
