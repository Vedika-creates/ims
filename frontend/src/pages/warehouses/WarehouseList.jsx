import React, { useState, useEffect } from 'react'
import { Warehouse, Plus, Edit, Trash2, Search, Filter, MapPin, Package, AlertTriangle, TrendingUp } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const WarehouseList = () => {
  const [warehouses, setWarehouses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    manager: '',
    contact: '',
    email: '',
    phone: '',
    capacity: 0,
    utilized: 0,
    status: 'Active'
  })

  useEffect(() => {
    // Load real data from API
    const loadWarehouses = async () => {
      try {
        setError('')
        const response = await fetch(`${API_URL}/warehouses`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load warehouses')
        }

        setWarehouses(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to load warehouses:', error)
        setError(error.message || 'Failed to load warehouses')
        setWarehouses([])
      } finally {
        setLoading(false)
      }
    }
    
    loadWarehouses()
  }, [])

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingWarehouse) {
        // Update existing warehouse
        const response = await fetch(`${API_URL}/warehouses/${editingWarehouse.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        })
        
        if (response.ok) {
          const updatedWarehouse = await response.json()
          setWarehouses(prev => prev.map(warehouse =>
            warehouse.id === editingWarehouse.id ? updatedWarehouse : warehouse
          ))
        } else {
          throw new Error('Failed to update warehouse')
        }
      } else {
        // Create new warehouse
        const response = await fetch(`${API_URL}/warehouses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        })
        
        if (response.ok) {
          const newWarehouse = await response.json()
          setWarehouses(prev => [...prev, newWarehouse])
        } else {
          throw new Error('Failed to create warehouse')
        }
      }
      
      setShowAddModal(false)
      setEditingWarehouse(null)
      resetForm()
    } catch (error) {
      console.error('Failed to save warehouse:', error)
      alert('Failed to save warehouse. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      manager: '',
      contact: '',
      email: '',
      phone: '',
      capacity: 0,
      utilized: 0,
      status: 'Active'
    })
  }

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse)
    setFormData(warehouse)
    setShowAddModal(true)
  }

  const handleDelete = async (warehouseId) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      try {
        const response = await fetch(`${API_URL}/warehouses/${warehouseId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          setWarehouses(prev => prev.filter(warehouse => warehouse.id !== warehouseId))
        } else {
          throw new Error('Failed to delete warehouse')
        }
      } catch (error) {
        console.error('Failed to delete warehouse:', error)
        alert('Failed to delete warehouse. Please try again.')
      }
    }
  }

  const getUtilizationColor = (utilized, capacity) => {
    const percentage = (utilized / capacity) * 100
    if (percentage >= 90) return 'red'
    if (percentage >= 75) return 'yellow'
    return 'green'
  }

  const getStatusBadgeColor = (status) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Warehouse className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
                <p className="text-sm text-gray-500">Manage warehouse locations and capacity</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Warehouse</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search warehouses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
            <button className="btn btn-secondary flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">Loading warehouses...</div>
            </div>
          ) : error ? (
            <div className="col-span-full flex items-center justify-center h-64">
              <div className="text-lg text-red-600">{error}</div>
            </div>
          ) : filteredWarehouses.length === 0 ? (
            <div className="col-span-full flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">No warehouses found</div>
            </div>
          ) : (
            filteredWarehouses.map((warehouse) => {
              return (
                <div key={warehouse.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Warehouse className="w-8 h-8 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{warehouse.name}</h3>
                        <p className="text-sm text-gray-500">ID: {String(warehouse.id).slice(0, 8)}...</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Package className="w-4 h-4 mr-2" />
                        {warehouse.total_items || 0} items
                      </div>
                      <div className="text-gray-500">
                        {warehouse.total_stock || 0} units
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {warehouse.total_locations || 0} locations
                      </div>
                      <div className="text-gray-500">
                        ₹{Number(warehouse.total_value || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-semibold text-red-600">{warehouse.out_of_stock || 0}</div>
                        <div className="text-gray-500">Out of Stock</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-yellow-600">{warehouse.low_stock || 0}</div>
                        <div className="text-gray-500">Low Stock</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{warehouse.normal_stock || 0}</div>
                        <div className="text-gray-500">Normal</div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    {warehouse.recent_activity > 0 && (
                      <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {warehouse.recent_activity} activities this week
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Created: {new Date(warehouse.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Warehouse ID: {String(warehouse.id).slice(0, 8)}...
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(warehouse)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(warehouse.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">
                {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
              </h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warehouse Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warehouse Code *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      placeholder="e.g., WH-A"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country *</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Manager *</label>
                    <input
                      type="text"
                      name="manager"
                      value={formData.manager}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                    <input
                      type="text"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity (sq ft)</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
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
                      <option value="Inactive">Inactive</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingWarehouse(null)
                      resetForm()
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingWarehouse ? 'Update Warehouse' : 'Add Warehouse'}
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

export default WarehouseList
