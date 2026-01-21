import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Eye, Edit, Calendar, User, Package, Truck, FileText, CheckCircle, Clock } from 'lucide-react'

const PODetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [po, setPo] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Mock data - replace with API call
    const mockPO = {
      id: parseInt(id),
      poNumber: 'PO-2024-015',
      prNumber: 'PR-2024-001',
      supplier: 'Tech Supplies Inc',
      orderDate: '2024-01-11',
      expectedDate: '2024-01-20',
      deliveryDate: null,
      status: 'Approved',
      approvedBy: 'Jane Doe',
      approvedDate: '2024-01-12',
      totalAmount: 25000,
      currency: 'USD',
      paymentTerms: 'Net 30',
      deliveryTerms: 'FOB',
      items: [
        {
          id: 1,
          sku: 'LAP-001',
          name: 'Laptop Dell Latitude',
          description: 'High-performance laptop for development team',
          quantity: 50,
          unitPrice: 800,
          total: 40000,
          received: 0,
          remaining: 50,
          category: 'Electronics',
          leadTime: 14,
          notes: 'Standard configuration with 16GB RAM, 512GB SSD'
        },
        {
          id: 2,
          sku: 'MON-002',
          name: 'Monitor 24 inch',
          description: '24-inch LED monitor with anti-glare coating',
          quantity: 30,
          unitPrice: 200,
          total: 6000,
          received: 0,
          remaining: 30,
          category: 'Electronics',
          leadTime: 14,
          notes: 'IPS panel, adjustable stand included'
        },
        {
          id: 3,
          sku: 'KEY-003',
          name: 'Keyboard Wireless',
          description: 'Wireless keyboard with backlit keys',
          quantity: 10,
          unitPrice: 50,
          total: 500,
          received: 0,
          remaining: 10,
          category: 'Electronics',
          leadTime: 7,
          notes: 'Bluetooth 5.0, long battery life'
        }
      ],
      notes: 'Urgent order for new hires and equipment upgrade',
      attachments: ['po_document.pdf', 'quote_tech_supplies.pdf', 'specifications.pdf'],
      createdAt: '2024-01-11T10:30:00Z',
      lastUpdated: '2024-01-12T14:20:00Z'
    }
    setPo(mockPO)
  }, [id])

  if (!po) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const handleEdit = () => {
    navigate(`/purchasing/orders/${id}/edit`)
  }

  const handleReceive = () => {
    navigate(`/grn/create?po=${po.poNumber}`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Approved': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Completed': return 'bg-purple-100 text-purple-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'Approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'In Progress': return <Package className="w-4 h-4 text-blue-500" />
      case 'Completed': return <CheckCircle className="w-4 h-4 text-purple-500" />
      case 'Cancelled': return <Clock className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getCompletionPercentage = (items) => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const receivedQuantity = items.reduce((sum, item) => sum + item.received, 0)
    return totalQuantity > 0 ? Math.round((receivedQuantity / totalQuantity) * 100) : 0
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/purchasing/orders')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Purchase Orders</span>
        </button>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Purchase Order Details</h1>
                  <p className="text-sm text-gray-500">{po.poNumber}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleEdit}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                {po.status === 'Approved' && (
                  <button
                    onClick={handleReceive}
                    className="btn btn-success flex items-center space-x-2"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Receive Goods</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['overview', 'items', 'status'].map((tab) => (
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
                    <h4 className="text-sm font-medium text-gray-500 mb-1">PO Number</h4>
                    <p className="text-lg font-semibold text-gray-900">{po.poNumber}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">PR Number</h4>
                    <p className="text-lg font-semibold text-gray-900">{po.prNumber}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Supplier</h4>
                    <p className="text-lg font-semibold text-gray-900">{po.supplier}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(po.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                        {po.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Order Date</h4>
                    <p className="text-lg font-semibold text-gray-900">{po.orderDate}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Expected Date</h4>
                    <p className="text-lg font-semibold text-gray-900">{po.expectedDate}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Total Amount</h4>
                    <p className="text-lg font-semibold text-gray-900">{po.currency} {po.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Completion</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-900">{getCompletionPercentage(po.items)}%</span>
                      <span className="text-sm text-gray-500">({po.items.reduce((sum, item) => sum + item.received, 0)}/{po.items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Payment Terms</h4>
                    <p className="text-lg font-semibold text-gray-900">{po.paymentTerms}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Delivery Terms</h4>
                    <p className="text-lg font-semibold text-gray-900">{po.deliveryTerms}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Approved By</h4>
                    <p className="text-lg font-semibold text-gray-900">{po.approvedBy}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Approved Date</h4>
                    <p className="text-lg font-semibold text-gray-900">{po.approvedDate}</p>
                  </div>
                </div>

                {po.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                    <p className="text-sm text-gray-700">{po.notes}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'items' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {po.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.sku}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{po.currency} {item.unitPrice}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{po.currency} {item.total.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.received}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.remaining}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.received > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.received > 0 ? 'Received' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.category === 'Electronics' ? 'bg-blue-100 text-blue-800' :
                              item.category === 'Office Supplies' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'status' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Current Status</h4>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(po.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                        {po.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {po.status === 'Pending' && 'Awaiting approval from purchasing manager'}
                    {po.status === 'Approved' && 'Approved and ready for fulfillment'}
                    {po.status === 'In Progress' && 'Order is being processed'}
                    {po.status === 'Completed' && 'Order has been fulfilled'}
                    {po.status === 'Cancelled' && 'Order has been cancelled'}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Approval Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Approved By:</span>
                        <span className="text-sm font-medium text-gray-900">{po.approvedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Approved Date:</span>
                        <span className="text-sm font-medium text-gray-900">{po.approvedDate}</span>
                      </div>
                    </div>
                  </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Delivery Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expected Date:</span>
                        <span className="text-sm font-medium text-gray-900">{po.expectedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Actual Date:</span>
                        <span className="text-sm font-medium text-gray-900">{po.deliveryDate || 'Not delivered yet'}</span>
                      </div>
                    </div>
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PODetails
