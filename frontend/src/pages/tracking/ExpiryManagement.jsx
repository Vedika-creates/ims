import React, { useState, useEffect } from 'react'
import { Calendar, AlertTriangle, TrendingUp, Search, Filter, Eye, Package, Clock, Trash2 } from 'lucide-react'

const ExpiryManagement = () => {
  const [expiryItems, setExpiryItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    // Mock data - replace with API call
    const mockExpiryItems = [
      {
        id: 1,
        itemName: 'Keyboard Wireless',
        sku: 'KEY-003',
        batchNumber: 'BATCH-005',
        quantity: 25,
        remainingQuantity: 0,
        expiryDate: '2024-01-15',
        manufacturingDate: '2023-06-15',
        warehouse: 'Warehouse A',
        location: 'A-01-02',
        status: 'Expired',
        daysUntilExpiry: -30,
        value: 1250,
        action: 'disposal',
        notes: 'Expired - needs disposal',
        createdAt: '2023-06-15T13:20:00Z',
        lastUpdated: '2024-01-15T00:00:00Z'
      },
      {
        id: 2,
        itemName: 'Monitor 24 inch',
        sku: 'MON-002',
        batchNumber: 'BATCH-004',
        quantity: 30,
        remainingQuantity: 5,
        expiryDate: '2024-02-28',
        manufacturingDate: '2023-02-28',
        warehouse: 'Warehouse A',
        location: 'A-02-01',
        status: 'Critical',
        daysUntilExpiry: 15,
        value: 1500,
        action: 'discount',
        notes: 'Expiring soon - consider discount promotion',
        createdAt: '2023-02-28T11:30:00Z',
        lastUpdated: '2024-01-14T10:30:00Z'
      },
      {
        id: 3,
        itemName: 'A4 Paper Pack',
        sku: 'PAP-002',
        batchNumber: 'BATCH-004',
        quantity: 100,
        remainingQuantity: 60,
        expiryDate: '2024-04-15',
        manufacturingDate: '2023-04-15',
        warehouse: 'Warehouse B',
        location: 'B-02-03',
        status: 'Warning',
        daysUntilExpiry: 61,
        value: 900,
        action: 'monitor',
        notes: 'Expiring in 2 months',
        createdAt: '2023-04-15T14:30:00Z',
        lastUpdated: '2024-01-13T15:45:00Z'
      },
      {
        id: 4,
        itemName: 'Laptop Dell Latitude',
        sku: 'LAP-001',
        batchNumber: 'BATCH-001',
        quantity: 50,
        remainingQuantity: 48,
        expiryDate: '2024-06-30',
        manufacturingDate: '2023-06-30',
        warehouse: 'Warehouse A',
        location: 'A-01-01',
        status: 'Warning',
        daysUntilExpiry: 137,
        value: 38400,
        action: 'monitor',
        notes: 'Expiring in 4 months',
        createdAt: '2023-06-30T09:00:00Z',
        lastUpdated: '2024-01-14T10:30:00Z'
      },
      {
        id: 5,
        itemName: 'Steel Rod 10mm',
        sku: 'RAW-003',
        batchNumber: 'BATCH-003',
        quantity: 1000,
        remainingQuantity: 820,
        expiryDate: '2024-12-31',
        manufacturingDate: '2023-12-31',
        warehouse: 'Warehouse C',
        location: 'C-03-02',
        status: 'Good',
        daysUntilExpiry: 351,
        value: 4100,
        action: 'none',
        notes: 'Long shelf life item',
        createdAt: '2023-12-31T10:15:00Z',
        lastUpdated: '2024-01-12T09:20:00Z'
      },
      {
        id: 6,
        itemName: 'Printer Ink Cartridge',
        sku: 'INK-007',
        batchNumber: 'BATCH-006',
        quantity: 20,
        remainingQuantity: 18,
        expiryDate: '2024-03-20',
        manufacturingDate: '2023-03-20',
        warehouse: 'Warehouse B',
        location: 'B-01-05',
        status: 'Critical',
        daysUntilExpiry: 36,
        value: 1800,
        action: 'priority_reorder',
        notes: 'Critical stock with expiry coming up',
        createdAt: '2023-03-20T16:45:00Z',
        lastUpdated: '2024-01-12T14:20:00Z'
      }
    ]
    setExpiryItems(mockExpiryItems)
  }, [])

  const filteredItems = expiryItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPeriod = selectedPeriod === 'all' || 
                         (selectedPeriod === '30' && item.daysUntilExpiry <= 30) ||
                         (selectedPeriod === '60' && item.daysUntilExpiry <= 60) ||
                         (selectedPeriod === '90' && item.daysUntilExpiry <= 90)
    return matchesSearch && matchesPeriod
  })

  const handleViewDetails = (item) => {
    setSelectedItem(item)
    setShowDetailsModal(true)
  }

  const getExpiryStatus = (daysUntilExpiry) => {
    if (daysUntilExpiry < 0) return { color: 'red', text: 'Expired', icon: AlertTriangle }
    if (daysUntilExpiry <= 30) return { color: 'red', text: 'Critical', icon: AlertTriangle }
    if (daysUntilExpiry <= 60) return { color: 'orange', text: 'Warning', icon: Clock }
    if (daysUntilExpiry <= 90) return { color: 'yellow', text: 'Warning', icon: TrendingUp }
    return { color: 'green', text: 'Good', icon: Package }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'disposal': return 'bg-red-100 text-red-800'
      case 'discount': return 'bg-orange-100 text-orange-800'
      case 'priority_reorder': return 'bg-purple-100 text-purple-800'
      case 'monitor': return 'bg-yellow-100 text-yellow-800'
      case 'none': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionText = (action) => {
    switch (action) {
      case 'disposal': return 'Dispose'
      case 'discount': return 'Discount'
      case 'priority_reorder': return 'Priority Reorder'
      case 'monitor': return 'Monitor'
      case 'none': return 'No Action'
      default: return action
    }
  }

  const handleAction = (item, action) => {
    switch (action) {
      case 'disposal':
        if (window.confirm('Dispose of expired items? This will remove them from inventory.')) {
          alert(`Disposing ${item.itemName} - ${item.remainingQuantity} units`)
        }
        break
      case 'discount':
        alert(`Creating discount promotion for ${item.itemName}`)
        break
      case 'priority_reorder':
        alert(`Creating priority reorder for ${item.itemName}`)
        break
      case 'monitor':
        alert(`Added ${item.itemName} to monitoring list`)
        break
      default:
        break
    }
  }

  const totalExpiredValue = expiryItems
    .filter(item => item.daysUntilExpiry < 0)
    .reduce((sum, item) => sum + (item.value * item.remainingQuantity), 0)

  const totalCriticalValue = expiryItems
    .filter(item => item.daysUntilExpiry > 0 && item.daysUntilExpiry <= 30)
    .reduce((sum, item) => sum + (item.value * item.remainingQuantity), 0)

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Expiry Management</h1>
                <p className="text-sm text-gray-500">Monitor and manage expiring inventory items</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-red-600 font-medium">
                  Expired Value: ${totalExpiredValue.toLocaleString()}
                </div>
                <div className="text-sm text-orange-600 font-medium">
                  Critical Value: ${totalCriticalValue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input-field"
            >
              <option value="all">All Items</option>
              <option value="30">Next 30 Days</option>
              <option value="60">Next 60 Days</option>
              <option value="90">Next 90 Days</option>
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
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value at Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommended Action
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const expiryStatus = getExpiryStatus(item.daysUntilExpiry)
                const StatusIcon = expiryStatus.icon
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                        <div className="text-sm text-gray-500">{item.sku}</div>
                        <div className="text-xs text-gray-400">{item.warehouse} • {item.location}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.batchNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Original: {item.quantity}</div>
                        <div>Remaining: {item.remainingQuantity}</div>
                        <div className="text-xs text-gray-500">
                          Used: {item.quantity - item.remainingQuantity}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {StatusIcon && <StatusIcon className={`w-4 h-4 text-${expiryStatus.color}-500`} />}
                        <div>
                          <div className={`text-sm font-medium text-${expiryStatus.color}-700`}>
                            {expiryStatus.text}
                          </div>
                          <div className="text-sm text-gray-900">
                            {item.expiryDate}
                          </div>
                          <div className={`text-xs text-${expiryStatus.color}-600`}>
                            {item.daysUntilExpiry >= 0 ? `${item.daysUntilExpiry} days` : `${Math.abs(item.daysUntilExpiry)} days ago`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${item.value.toLocaleString()} per unit
                      </div>
                      <div className="text-sm text-red-600 font-medium">
                        ${(item.value * item.remainingQuantity).toLocaleString()} total
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(item.action)}`}>
                        {getActionText(item.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction(item, item.action)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <TrendingUp className="w-4 h-4" />
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

      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Expiry Details: {selectedItem.itemName}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <Calendar className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Item Information</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedItem.itemName}</p>
                  <p className="text-sm text-gray-600">{selectedItem.sku}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Expiry Status</h4>
                  <div className="flex items-center space-x-2">
                    {getExpiryStatus(selectedItem.daysUntilExpiry).icon && 
                      React.createElement(getExpiryStatus(selectedItem.daysUntilExpiry).icon, {
                        className: `w-4 h-4 text-${getExpiryStatus(selectedItem.daysUntilExpiry).color}-500`
                      })
                    }
                    <span className={`text-lg font-semibold text-${getExpiryStatus(selectedItem.daysUntilExpiry).color}-700`}>
                      {getExpiryStatus(selectedItem.daysUntilExpiry).text}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedItem.daysUntilExpiry >= 0 ? `${selectedItem.daysUntilExpiry} days` : `${Math.abs(selectedItem.daysUntilExpiry)} days ago`}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Value at Risk</h4>
                  <p className="text-lg font-semibold text-red-600">
                    ${(selectedItem.value * selectedItem.remainingQuantity).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    ${selectedItem.value.toLocaleString()} per unit × {selectedItem.remainingQuantity} units
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Recommended Action</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getActionColor(selectedItem.action)}`}>
                    {getActionText(selectedItem.action)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Batch Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Batch Number:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedItem.batchNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Manufacturing Date:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedItem.manufacturingDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Original Quantity:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedItem.quantity}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Location & Quantity</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Warehouse:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedItem.warehouse}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedItem.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Remaining Quantity:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedItem.remainingQuantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Used Quantity:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedItem.quantity - selectedItem.remainingQuantity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Notes</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{selectedItem.notes}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleAction(selectedItem, selectedItem.action)
                    setShowDetailsModal(false)
                  }}
                  className="btn btn-primary"
                >
                  Execute Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpiryManagement
