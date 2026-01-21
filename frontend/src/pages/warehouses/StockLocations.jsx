import React, { useState, useEffect } from 'react'
import { MapPin, Plus, Search, Filter, Edit, Trash2, Package, AlertTriangle } from 'lucide-react'

const StockLocations = () => {
  const [locations, setLocations] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [formData, setFormData] = useState({
    warehouse: '',
    aisle: '',
    bay: '',
    level: '',
    zone: '',
    capacity: 0,
    utilized: 0,
    locationType: 'Standard',
    temperatureControlled: false,
    hazardous: false,
    securityLevel: 'Normal'
  })

  const warehouses = ['Warehouse A', 'Warehouse B', 'Warehouse C']
  const locationTypes = ['Standard', 'Cold Storage', 'Hazardous', 'High Security', 'Bulk Storage']
  const securityLevels = ['Normal', 'Restricted', 'High Security']

  useEffect(() => {
    // Mock data - replace with API call
    const mockLocations = [
      {
        id: 1,
        warehouse: 'Warehouse A',
        aisle: 'A',
        bay: '01',
        level: '01',
        zone: 'Electronics',
        capacity: 100,
        utilized: 85,
        locationType: 'Standard',
        temperatureControlled: false,
        hazardous: false,
        securityLevel: 'Normal',
        items: 45,
        lastUpdated: '2024-01-14T10:30:00Z'
      },
      {
        id: 2,
        warehouse: 'Warehouse A',
        aisle: 'A',
        bay: '01',
        level: '02',
        zone: 'Electronics',
        capacity: 100,
        utilized: 90,
        locationType: 'Standard',
        temperatureControlled: false,
        hazardous: false,
        securityLevel: 'Normal',
        items: 52,
        lastUpdated: '2024-01-14T09:15:00Z'
      },
      {
        id: 3,
        warehouse: 'Warehouse A',
        aisle: 'B',
        bay: '01',
        level: '01',
        zone: 'Office Supplies',
        capacity: 100,
        utilized: 95,
        locationType: 'Standard',
        temperatureControlled: false,
        hazardous: false,
        securityLevel: 'Normal',
        items: 67,
        lastUpdated: '2024-01-13T16:45:00Z'
      },
      {
        id: 4,
        warehouse: 'Warehouse B',
        aisle: 'C',
        bay: '01',
        level: '01',
        zone: 'Raw Materials',
        capacity: 200,
        utilized: 180,
        locationType: 'Bulk Storage',
        temperatureControlled: false,
        hazardous: true,
        securityLevel: 'Restricted',
        items: 120,
        lastUpdated: '2024-01-13T14:20:00Z'
      },
      {
        id: 5,
        warehouse: 'Warehouse C',
        aisle: 'D',
        bay: '01',
        level: '01',
        zone: 'Perishables',
        capacity: 50,
        utilized: 45,
        locationType: 'Cold Storage',
        temperatureControlled: true,
        hazardous: false,
        securityLevel: 'Normal',
        items: 28,
        lastUpdated: '2024-01-12T11:30:00Z'
      }
    ]
    setLocations(mockLocations)
  }, [])

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.aisle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.bay.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.zone.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesWarehouse = selectedWarehouse === 'all' || location.warehouse === selectedWarehouse
    return matchesSearch && matchesWarehouse
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingLocation) {
      setLocations(prev => prev.map(location =>
        location.id === editingLocation.id
          ? { ...location, ...formData, lastUpdated: new Date().toISOString() }
          : location
      ))
    } else {
      const newLocation = {
        id: locations.length + 1,
        ...formData,
        items: 0,
        lastUpdated: new Date().toISOString()
      }
      setLocations(prev => [...prev, newLocation])
    }
    setShowAddModal(false)
    setEditingLocation(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      warehouse: '',
      aisle: '',
      bay: '',
      level: '',
      zone: '',
      capacity: 0,
      utilized: 0,
      locationType: 'Standard',
      temperatureControlled: false,
      hazardous: false,
      securityLevel: 'Normal'
    })
  }

  const handleEdit = (location) => {
    setEditingLocation(location)
    setFormData(location)
    setShowAddModal(true)
  }

  const handleDelete = (locationId) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      setLocations(prev => prev.filter(location => location.id !== locationId))
    }
  }

  const getUtilizationColor = (utilized, capacity) => {
    const percentage = (utilized / capacity) * 100
    if (percentage >= 90) return 'red'
    if (percentage >= 75) return 'yellow'
    return 'green'
  }

  const getLocationTypeColor = (type) => {
    switch (type) {
      case 'Cold Storage': return 'bg-blue-100 text-blue-800'
      case 'Hazardous': return 'bg-red-100 text-red-800'
      case 'High Security': return 'bg-purple-100 text-purple-800'
      case 'Bulk Storage': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Stock Locations</h1>
                <p className="text-sm text-gray-500">Manage warehouse storage locations and capacity</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Location</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="input-field"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map(warehouse => (
                <option key={warehouse} value={warehouse}>{warehouse}</option>
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
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLocations.map((location) => {
                const utilizationPercentage = Math.round((location.utilized / location.capacity) * 100)
                const utilizationColor = getUtilizationColor(location.utilized, location.capacity)
                
                return (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {location.aisle}-{location.bay}-{location.level}
                      </div>
                      <div className="text-xs text-gray-500">
                        {location.temperatureControlled && '🌡️ '}
                        {location.hazardous && '☣️ '}
                        {location.securityLevel === 'High Security' && '🔒 '}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {location.warehouse}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {location.zone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLocationTypeColor(location.locationType)}`}>
                        {location.locationType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {location.capacity} sq ft
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`bg-${utilizationColor}-500 h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${utilizationPercentage}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-sm font-medium text-${utilizationColor}-600`}>
                          {utilizationPercentage}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {location.utilized} / {location.capacity} sq ft
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {location.items} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(location)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(location.id)}
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
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <label className="block text-sm font-medium text-gray-700">Zone *</label>
                    <input
                      type="text"
                      name="zone"
                      value={formData.zone}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      placeholder="e.g., Electronics, Raw Materials"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Aisle *</label>
                    <input
                      type="text"
                      name="aisle"
                      value={formData.aisle}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      placeholder="e.g., A, B, C"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bay *</label>
                    <input
                      type="text"
                      name="bay"
                      value={formData.bay}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      placeholder="e.g., 01, 02"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Level *</label>
                    <input
                      type="text"
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      placeholder="e.g., 01, 02"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location Type</label>
                    <select
                      name="locationType"
                      value={formData.locationType}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    >
                      {locationTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity (sq ft) *</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currently Utilized (sq ft)</label>
                    <input
                      type="number"
                      name="utilized"
                      value={formData.utilized}
                      onChange={handleInputChange}
                      min="0"
                      max={formData.capacity}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Security Level</label>
                    <select
                      name="securityLevel"
                      value={formData.securityLevel}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    >
                      {securityLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Special Requirements</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="temperatureControlled"
                        checked={formData.temperatureControlled}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Temperature Controlled</div>
                        <div className="text-xs text-gray-500">For perishable items</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="hazardous"
                        checked={formData.hazardous}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Hazardous Materials</div>
                        <div className="text-xs text-gray-500">For dangerous goods</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingLocation(null)
                      resetForm()
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingLocation ? 'Update Location' : 'Add Location'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockLocations
