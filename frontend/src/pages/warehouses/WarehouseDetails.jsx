import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Warehouse, ArrowLeft, MapPin, Package, Users, TrendingUp, AlertTriangle, Edit } from 'lucide-react'

const WarehouseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [warehouse, setWarehouse] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [locations, setLocations] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    // Mock data - replace with API call
    const mockWarehouse = {
      id: parseInt(id),
      name: 'Warehouse A',
      code: 'WH-A',
      address: '123 Industrial Blvd',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postalCode: '10001',
      manager: 'John Smith',
      contact: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+1-555-0101',
      capacity: 10000,
      utilized: 7500,
      status: 'Active',
      totalItems: 1250,
      lowStockItems: 15,
      totalValue: 2500000,
      createdAt: '2023-01-15T09:00:00Z',
      lastUpdated: '2024-01-14T10:30:00Z'
    }

    const mockLocations = [
      { id: 1, aisle: 'A', bay: '01', level: '01', capacity: 100, utilized: 85, items: 45 },
      { id: 2, aisle: 'A', bay: '01', level: '02', capacity: 100, utilized: 90, items: 52 },
      { id: 3, aisle: 'A', bay: '02', level: '01', capacity: 100, utilized: 70, items: 38 },
      { id: 4, aisle: 'B', bay: '01', level: '01', capacity: 100, utilized: 95, items: 67 },
      { id: 5, aisle: 'B', bay: '02', level: '01', capacity: 100, utilized: 60, items: 28 }
    ]

    const mockActivity = [
      { id: 1, date: '2024-01-14T10:30:00Z', type: 'GRN', reference: 'GRN-001', description: 'Received 50 units of Laptop Dell Latitude', user: 'John Smith' },
      { id: 2, date: '2024-01-14T09:15:00Z', type: 'Transfer', reference: 'TO-001', description: 'Transferred 10 units to Warehouse B', user: 'Jane Doe' },
      { id: 3, date: '2024-01-13T16:45:00Z', type: 'Stock Adjustment', reference: 'ADJ-001', description: 'Adjusted stock levels for A4 Paper', user: 'Mike Johnson' },
      { id: 4, date: '2024-01-13T14:20:00Z', type: 'Pick', reference: 'SO-001', description: 'Picked 5 units for customer order', user: 'Sarah Wilson' }
    ]

    setWarehouse(mockWarehouse)
    setLocations(mockLocations)
    setRecentActivity(mockActivity)
  }, [id])

  if (!warehouse) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const utilizationPercentage = Math.round((warehouse.utilized / warehouse.capacity) * 100)
  const getUtilizationColor = (utilized, capacity) => {
    const percentage = (utilized / capacity) * 100
    if (percentage >= 90) return 'red'
    if (percentage >= 75) return 'yellow'
    return 'green'
  }

  const utilizationColor = getUtilizationColor(warehouse.utilized, warehouse.capacity)

  const handleEdit = () => {
    navigate(`/warehouses/${id}/edit`)
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/warehouses')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Warehouses</span>
        </button>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Warehouse className="w-10 h-10 text-gray-400" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
                  <p className="text-sm text-gray-500">Code: {warehouse.code}</p>
                </div>
              </div>
              <button
                onClick={handleEdit}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{warehouse.totalItems}</div>
                <div className="text-sm text-gray-500">Total Items</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="text-lg font-semibold text-yellow-700">
                    {warehouse.lowStockItems}
                  </span>
                </div>
                <div className="text-sm text-gray-500">Low Stock Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">${warehouse.totalValue.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Value</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className={`w-5 h-5 text-${utilizationColor}-500`} />
                  <span className={`text-lg font-semibold text-${utilizationColor}-700`}>
                    {utilizationPercentage}%
                  </span>
                </div>
                <div className="text-sm text-gray-500">Space Utilization</div>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['overview', 'locations', 'activity'].map((tab) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Address</dt>
                        <dd className="text-sm text-gray-900 text-right max-w-xs">{warehouse.address}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">City, State</dt>
                        <dd className="text-sm text-gray-900">{warehouse.city}, {warehouse.state}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Country</dt>
                        <dd className="text-sm text-gray-900">{warehouse.country}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Postal Code</dt>
                        <dd className="text-sm text-gray-900">{warehouse.postalCode}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Manager</dt>
                        <dd className="text-sm text-gray-900">{warehouse.manager}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="text-sm text-gray-900">{warehouse.email}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Phone</dt>
                        <dd className="text-sm text-gray-900">{warehouse.phone}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {warehouse.status}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Capacity & Utilization</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Space Utilization</span>
                        <span className={`font-medium text-${utilizationColor}-600`}>
                          {utilizationPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`bg-${utilizationColor}-500 h-3 rounded-full transition-all duration-300`}
                          style={{ width: `${utilizationPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {warehouse.utilized.toLocaleString()} / {warehouse.capacity.toLocaleString()} sq ft
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Capacity</span>
                        <span className="text-sm font-medium text-gray-900">{warehouse.capacity.toLocaleString()} sq ft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Utilized Space</span>
                        <span className="text-sm font-medium text-gray-900">{warehouse.utilized.toLocaleString()} sq ft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Available Space</span>
                        <span className="text-sm font-medium text-green-600">{(warehouse.capacity - warehouse.utilized).toLocaleString()} sq ft</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'locations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Storage Locations</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilized</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization %</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {locations.map((location) => {
                        const locationUtilization = Math.round((location.utilized / location.capacity) * 100)
                        const locationColor = locationUtilization >= 90 ? 'red' : locationUtilization >= 75 ? 'yellow' : 'green'
                        
                        return (
                          <tr key={location.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {location.aisle}-{location.bay}-{location.level}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {location.capacity} sq ft
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {location.utilized} sq ft
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {location.items} items
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`bg-${locationColor}-500 h-2 rounded-full`}
                                      style={{ width: `${locationUtilization}%` }}
                                    />
                                  </div>
                                </div>
                                <span className={`text-sm font-medium text-${locationColor}-600`}>
                                  {locationUtilization}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {activity.type === 'GRN' && <Package className="w-5 h-5 text-green-500" />}
                        {activity.type === 'Transfer' && <MapPin className="w-5 h-5 text-blue-500" />}
                        {activity.type === 'Stock Adjustment' && <Edit className="w-5 h-5 text-yellow-500" />}
                        {activity.type === 'Pick' && <Users className="w-5 h-5 text-purple-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {activity.reference} • {activity.user}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(activity.date).toLocaleString()}
                        </div>
                      </div>
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

export default WarehouseDetails
