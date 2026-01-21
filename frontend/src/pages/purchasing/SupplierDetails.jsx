import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Building, ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, FileText, Package, TrendingUp, Star } from 'lucide-react'

const SupplierDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Mock data - replace with API call
    const mockSupplier = {
      id: parseInt(id),
      name: 'Tech Supplies Inc',
      code: 'SUP-001',
      contactPerson: 'John Smith',
      email: 'john.smith@techsupplies.com',
      phone: '+1-555-0101',
      address: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94105',
      website: 'www.techsupplies.com',
      rating: 4.5,
      status: 'Active',
      paymentTerms: 'Net 30',
      deliveryTerms: 'FOB',
      totalOrders: 45,
      totalValue: 1250000,
      lastOrderDate: '2024-01-10',
      notes: 'Reliable supplier for electronics with excellent delivery times and quality products.',
      certifications: ['ISO 9001', 'CE Certified'],
      categories: ['Electronics', 'Computer Hardware', 'Office Equipment'],
      createdAt: '2023-01-15T09:00:00Z',
      lastUpdated: '2024-01-10T14:30:00Z'
    }
    setSupplier(mockSupplier)
  }, [id])

  if (!supplier) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const handleEdit = () => {
    navigate(`/suppliers/${id}/edit`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-gray-100 text-gray-800'
      case 'Suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRatingStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />)
      }
    }
    return stars
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/suppliers')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Suppliers</span>
        </button>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building className="w-8 h-8 text-gray-400" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
                  <p className="text-sm text-gray-500">{supplier.code}</p>
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
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['overview', 'orders', 'performance'].map((tab) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Person</h4>
                    <p className="text-lg font-semibold text-gray-900">{supplier.contactPerson}</p>
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{supplier.email}</span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{supplier.phone}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Address</h4>
                    <p className="text-lg font-semibold text-gray-900">{supplier.address}</p>
                    <p className="text-sm text-gray-500">{supplier.city}, {supplier.state}, {supplier.country}</p>
                    <p className="text-sm text-gray-500">{supplier.postalCode}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Website</h4>
                    <a href={`http://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-600 hover:text-blue-800">
                      {supplier.website}
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Rating</h4>
                    <div className="flex items-center space-x-2">
                      {getRatingStars(supplier.rating)}
                      <span className="text-lg font-semibold text-gray-900">{supplier.rating}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(supplier.status)}`}>
                      {supplier.status}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Payment Terms</h4>
                    <p className="text-lg font-semibold text-gray-900">{supplier.paymentTerms}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Delivery Terms</h4>
                    <p className="text-lg font-semibold text-gray-900">{supplier.deliveryTerms}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Total Orders</h4>
                    <p className="text-lg font-semibold text-gray-900">{supplier.totalOrders}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Total Value</h4>
                    <p className="text-lg font-semibold text-gray-900">${supplier.totalValue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Last Order</h4>
                    <p className="text-lg font-semibold text-gray-900">{supplier.lastOrderDate}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Created</h4>
                    <p className="text-lg font-semibold text-gray-900">{new Date(supplier.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h4>
                    <p className="text-lg font-semibold text-gray-900">{new Date(supplier.lastUpdated).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {supplier.categories.map((category, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {supplier.certifications.map((cert, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                {supplier.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                    <p className="text-sm text-gray-700">{supplier.notes}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-center">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Order history would be displayed here</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">On-Time Delivery</h4>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span className="text-2xl font-bold text-green-600">95%</span>
                    </div>
                    <p className="text-sm text-gray-500">Last 12 months</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Quality Score</h4>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span className="text-2xl font-bold text-green-600">4.5/5</span>
                    </div>
                    <p className="text-sm text-gray-500">Based on last 50 orders</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Average Order Value</h4>
                    <div className="text-2xl font-bold text-gray-900">${(supplier.totalValue / supplier.totalOrders).toLocaleString()}</div>
                    <p className="text-sm text-gray-500">Per order</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Response Time</h4>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span className="text-2xl font-bold text-green-600">24h</span>
                    </div>
                    <p className="text-sm text-gray-500">Average response time</p>
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

export default SupplierDetails
