import React, { useState, useEffect } from 'react'
import { Bell, Search, Filter, Eye, CheckCircle, XCircle, AlertTriangle, Clock, Mail, Smartphone, Monitor } from 'lucide-react'

const Alerts = () => {
  const [alerts, setAlerts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState(null)

  useEffect(() => {
    // Mock data - replace with API call
    const mockAlerts = [
      {
        id: 1,
        type: 'low_stock',
        title: 'Low Stock Alert: Laptop Dell Latitude',
        message: 'Current stock (25 units) has fallen below reorder point (15 units)',
        severity: 'high',
        status: 'active',
        itemName: 'Laptop Dell Latitude',
        sku: 'LAP-001',
        currentStock: 25,
        reorderPoint: 15,
        safetyStock: 10,
        warehouse: 'Warehouse A',
        location: 'A-01-01',
        triggeredAt: '2024-01-14T10:30:00Z',
        acknowledgedAt: null,
        acknowledgedBy: null,
        actions: ['create_po', 'transfer_stock'],
        notifications: [
          { type: 'email', sent: true, sentAt: '2024-01-14T10:31:00Z', recipient: 'john.smith@company.com' },
          { type: 'sms', sent: true, sentAt: '2024-01-14T10:31:30Z', recipient: '+1-555-0101' }
        ]
      },
      {
        id: 2,
        type: 'critical_stock',
        title: 'Critical Stock: Steel Rod 10mm',
        message: 'Current stock (80 units) has fallen below safety stock level (100 units)',
        severity: 'critical',
        status: 'active',
        itemName: 'Steel Rod 10mm',
        sku: 'RAW-003',
        currentStock: 80,
        reorderPoint: 150,
        safetyStock: 100,
        warehouse: 'Warehouse C',
        location: 'C-03-02',
        triggeredAt: '2024-01-14T09:15:00Z',
        acknowledgedAt: null,
        acknowledgedBy: null,
        actions: ['urgent_po', 'transfer_stock'],
        notifications: [
          { type: 'email', sent: true, sentAt: '2024-01-14T09:16:00Z', recipient: 'mike.johnson@company.com' },
          { type: 'sms', sent: true, sentAt: '2024-01-14T09:16:30Z', recipient: '+1-555-0103' },
          { type: 'dashboard', sent: true, sentAt: '2024-01-14T09:15:30Z', recipient: 'all_managers' }
        ]
      },
      {
        id: 3,
        type: 'expiry_warning',
        title: 'Expiry Warning: A4 Paper Pack',
        message: 'Batch BATCH-004 of A4 Paper Pack expires in 30 days (2025-02-13)',
        severity: 'medium',
        status: 'active',
        itemName: 'A4 Paper Pack',
        sku: 'PAP-002',
        batchNumber: 'BATCH-004',
        expiryDate: '2025-02-13',
        quantity: 100,
        warehouse: 'Warehouse B',
        location: 'B-02-03',
        triggeredAt: '2024-01-13T14:20:00Z',
        acknowledgedAt: '2024-01-13T15:30:00Z',
        acknowledgedBy: 'Jane Doe',
        actions: ['discount_promotion', 'return_to_supplier'],
        notifications: [
          { type: 'email', sent: true, sentAt: '2024-01-13T14:21:00Z', recipient: 'jane.doe@company.com' }
        ]
      },
      {
        id: 4,
        type: 'overstock',
        title: 'Overstock Alert: Monitor 24 inch',
        message: 'Current stock (150 units) exceeds maximum stock level (100 units)',
        severity: 'low',
        status: 'acknowledged',
        itemName: 'Monitor 24 inch',
        sku: 'MON-002',
        currentStock: 150,
        maxStock: 100,
        warehouse: 'Warehouse A',
        location: 'A-02-01',
        triggeredAt: '2024-01-12T11:45:00Z',
        acknowledgedAt: '2024-01-12T13:20:00Z',
        acknowledgedBy: 'John Smith',
        actions: ['transfer_out', 'cancel_orders'],
        notifications: [
          { type: 'email', sent: true, sentAt: '2024-01-12T11:46:00Z', recipient: 'john.smith@company.com' }
        ]
      },
      {
        id: 5,
        type: 'system',
        title: 'System Maintenance Scheduled',
        message: 'Inventory management system will be under maintenance on 2024-01-20 from 02:00 AM to 04:00 AM EST',
        severity: 'info',
        status: 'acknowledged',
        itemName: null,
        sku: null,
        triggeredAt: '2024-01-10T16:30:00Z',
        acknowledgedAt: '2024-01-10T17:15:00Z',
        acknowledgedBy: 'System Admin',
        actions: ['schedule_maintenance'],
        notifications: [
          { type: 'email', sent: true, sentAt: '2024-01-10T16:31:00Z', recipient: 'all_users' },
          { type: 'dashboard', sent: true, sentAt: '2024-01-10T16:30:30Z', recipient: 'all_users' }
        ]
      }
    ]
    setAlerts(mockAlerts)
  }, [])

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (alert.itemName && alert.itemName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = selectedType === 'all' || alert.type === selectedType
    const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const handleViewDetails = (alert) => {
    setSelectedAlert(alert)
    setShowDetailsModal(true)
  }

  const handleAcknowledge = (alertId) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? { 
            ...alert, 
            status: 'acknowledged',
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy: 'Current User'
          }
        : alert
    ))
  }

  const handleResolve = (alertId) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? { 
            ...alert, 
            status: 'resolved',
            resolvedAt: new Date().toISOString(),
            resolvedBy: 'Current User'
          }
        : alert
    ))
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'medium': return <Bell className="w-4 h-4 text-yellow-500" />
      case 'low': return <Bell className="w-4 h-4 text-blue-500" />
      case 'info': return <Monitor className="w-4 h-4 text-gray-500" />
      default: return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      case 'info': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'low_stock': return <AlertTriangle className="w-4 h-4" />
      case 'critical_stock': return <AlertTriangle className="w-4 h-4" />
      case 'expiry_warning': return <Clock className="w-4 h-4" />
      case 'overstock': return <Bell className="w-4 h-4" />
      case 'system': return <Monitor className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />
      case 'sms': return <Smartphone className="w-4 h-4" />
      case 'dashboard': return <Monitor className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
                <p className="text-sm text-gray-500">Monitor and manage inventory alerts and system notifications</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                {alerts.filter(a => a.status === 'active').length} Active
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value="low_stock">Low Stock</option>
              <option value="critical_stock">Critical Stock</option>
              <option value="expiry_warning">Expiry Warning</option>
              <option value="overstock">Overstock</option>
              <option value="system">System</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
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
                  Alert Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item/Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Triggered
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
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start space-x-3">
                      {getTypeIcon(alert.type)}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                        <div className="text-sm text-gray-500">{alert.message}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {alert.notifications.map((notif, index) => (
                            <span key={index} className="inline-flex items-center space-x-1 mr-3">
                              {getNotificationIcon(notif.type)}
                              <span>{notif.type}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(alert.severity)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {alert.itemName ? (
                      <div>
                        <div className="text-sm text-gray-900">{alert.itemName}</div>
                        <div className="text-sm text-gray-500">{alert.sku}</div>
                        <div className="text-xs text-gray-400">{alert.warehouse} • {alert.location}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">System-wide</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(alert.triggeredAt).toLocaleString()}
                    </div>
                    {alert.acknowledgedAt && (
                      <div className="text-xs text-gray-500">
                        Acknowledged: {new Date(alert.acknowledgedAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(alert)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {alert.status === 'active' && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {alert.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="text-green-600 hover:text-green-900"
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
      </div>

      {showDetailsModal && selectedAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Alert Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Alert Information</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedAlert.title}</p>
                  <p className="text-sm text-gray-600 mt-2">{selectedAlert.message}</p>
                  <div className="flex items-center space-x-2 mt-3">
                    {getSeverityIcon(selectedAlert.severity)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(selectedAlert.severity)}`}>
                      {selectedAlert.severity}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAlert.status)}`}>
                      {selectedAlert.status}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Timing</h4>
                  <p className="text-sm text-gray-900">
                    <div>Triggered: {new Date(selectedAlert.triggeredAt).toLocaleString()}</div>
                    {selectedAlert.acknowledgedAt && (
                      <div>Acknowledged: {new Date(selectedAlert.acknowledgedAt).toLocaleString()}</div>
                    )}
                    {selectedAlert.resolvedAt && (
                      <div>Resolved: {new Date(selectedAlert.resolvedAt).toLocaleString()}</div>
                    )}
                  </p>
                  {selectedAlert.acknowledgedBy && (
                    <p className="text-sm text-gray-600 mt-2">By: {selectedAlert.acknowledgedBy}</p>
                  )}
                </div>
              </div>

              {selectedAlert.itemName && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Item Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Item Information</h5>
                      <div className="space-y-1">
                        <div className="text-sm"><strong>Name:</strong> {selectedAlert.itemName}</div>
                        <div className="text-sm"><strong>SKU:</strong> {selectedAlert.sku}</div>
                        <div className="text-sm"><strong>Warehouse:</strong> {selectedAlert.warehouse}</div>
                        <div className="text-sm"><strong>Location:</strong> {selectedAlert.location}</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Stock Levels</h5>
                      <div className="space-y-1">
                        <div className="text-sm"><strong>Current Stock:</strong> {selectedAlert.currentStock}</div>
                        {selectedAlert.reorderPoint && (
                          <div className="text-sm"><strong>Reorder Point:</strong> {selectedAlert.reorderPoint}</div>
                        )}
                        {selectedAlert.safetyStock && (
                          <div className="text-sm"><strong>Safety Stock:</strong> {selectedAlert.safetyStock}</div>
                        )}
                        {selectedAlert.maxStock && (
                          <div className="text-sm"><strong>Max Stock:</strong> {selectedAlert.maxStock}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Notifications Sent</h4>
                <div className="space-y-2">
                  {selectedAlert.notifications.map((notif, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        {getNotificationIcon(notif.type)}
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">{notif.type}</div>
                          <div className="text-sm text-gray-500">To: {notif.recipient}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          {new Date(notif.sentAt).toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600">Sent</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                {selectedAlert.status === 'active' && (
                  <button
                    onClick={() => {
                      handleAcknowledge(selectedAlert.id)
                      setShowDetailsModal(false)
                    }}
                    className="btn btn-warning"
                  >
                    Acknowledge
                  </button>
                )}
                {selectedAlert.status !== 'resolved' && (
                  <button
                    onClick={() => {
                      handleResolve(selectedAlert.id)
                      setShowDetailsModal(false)
                    }}
                    className="btn btn-success"
                  >
                    Resolve
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

export default Alerts
