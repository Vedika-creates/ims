import React, { useState, useEffect } from 'react'
import { Building, Plus, Search, Filter, Eye, Edit, Trash2, MapPin, Phone, Mail, Star } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    website: '',
    rating: 0,
    status: 'Active',
    paymentTerms: 'Net 30',
    deliveryTerms: 'FOB',
    notes: ''
  })

  useEffect(() => {
    // Load real data from API
    const loadSuppliers = async () => {
      try {
        const response = await fetch(`${API_URL}/suppliers`)
        const data = await response.json()
        
        // Transform database fields to match frontend expectations
        const transformedData = data.map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          code: supplier.code || 'N/A',
          contactPerson: supplier.contact_person || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          website: '',
          rating: Number(supplier.rating ?? 0),
          status: supplier.is_active ? 'Active' : 'Inactive',
          paymentTerms: '',
          deliveryTerms: '',
          totalOrders: parseInt(supplier.order_count) || 0,
          totalValue: 0,
          lastOrderDate: null,
          notes: `Lead time: ${supplier.lead_time_days || 0} days`,
          createdAt: supplier.created_at
        }))
        
        setSuppliers(transformedData)
      } catch (error) {
        console.error('Failed to load suppliers:', error)
        setSuppliers([])
      }
    }
    
    loadSuppliers()
  }, [])

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || supplier.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log(' Submitting supplier form:', formData)
    
    try {
      if (editingSupplier) {
        // Update existing supplier
        console.log(' Updating supplier:', editingSupplier.id)
        const response = await fetch(`${API_URL}/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            contactPerson: formData.contactPerson,
            email: formData.email,
            phone: formData.phone,
            leadTimeDays: 0,
            rating: formData.rating
          })
        })
        
        console.log(' Update response status:', response.status)
        
        if (!response.ok) {
          throw new Error('Failed to update supplier')
        }
        
        const updatedSupplier = await response.json()
        console.log(' Updated supplier:', updatedSupplier)
        
        setSuppliers(prev => prev.map(supplier =>
          supplier.id === editingSupplier.id
            ? { ...supplier, ...updatedSupplier }
            : supplier
        ))
      } else {
        // Create new supplier
        console.log(' Creating new supplier')
        const response = await fetch(`${API_URL}/suppliers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            contactPerson: formData.contactPerson,
            email: formData.email,
            phone: formData.phone,
            leadTimeDays: 0,
            rating: formData.rating
          })
        })
        
        console.log(' Create response status:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error(' API Error:', errorData)
          throw new Error(`Failed to create supplier: ${errorData.error || 'Unknown error'}`)
        }
        
        const newSupplier = await response.json()
        console.log(' Created supplier:', newSupplier)
        
        // Transform response to match frontend format
        const transformedSupplier = {
          id: newSupplier.id,
          name: newSupplier.name,
          code: 'N/A',
          contactPerson: newSupplier.contact_person || '',
          email: newSupplier.email || '',
          phone: newSupplier.phone || '',
          address: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          website: '',
          rating: Number(newSupplier.rating ?? formData.rating ?? 0),
          status: newSupplier.is_active ? 'Active' : 'Inactive',
          paymentTerms: '',
          deliveryTerms: '',
          totalOrders: 0,
          totalValue: 0,
          lastOrderDate: null,
          notes: `Lead time: ${newSupplier.lead_time_days || 0} days`,
          createdAt: newSupplier.created_at
        }
        
        console.log(' Transformed supplier for frontend:', transformedSupplier)
        
        setSuppliers(prev => {
          console.log(' Previous suppliers:', prev.length)
          const newList = [...prev, transformedSupplier]
          console.log(' New suppliers count:', newList.length)
          return newList
        })
      }
      
      setShowAddModal(false)
      setEditingSupplier(null)
      resetForm()
      console.log(' Form submitted successfully')
    } catch (error) {
      console.error(' Error saving supplier:', error)
      alert(`Failed to save supplier: ${error.message}`)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      website: '',
      rating: 0,
      status: 'Active',
      paymentTerms: 'Net 30',
      deliveryTerms: 'FOB',
      notes: ''
    })
  }

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setFormData(supplier)
    setShowAddModal(true)
  }

  const handleDelete = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      console.log('🗑️ Deleting supplier:', supplierId)
      
      try {
        const response = await fetch(`${API_URL}/suppliers/${supplierId}`, {
          method: 'DELETE'
        })
        
        console.log('📡 Delete response status:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ API Error:', errorData)
          throw new Error(`Failed to delete supplier: ${errorData.error || 'Unknown error'}`)
        }
        
        const result = await response.json()
        console.log('✅ Deleted supplier result:', result)
        
        // Remove from local state
        setSuppliers(prev => {
          console.log('📋 Previous suppliers:', prev.length)
          const newList = prev.filter(supplier => supplier.id !== supplierId)
          console.log('📋 New suppliers count:', newList.length)
          return newList
        })
        
        console.log('✅ Supplier deleted successfully')
      } catch (error) {
        console.error('❌ Error deleting supplier:', error)
        alert(`Failed to delete supplier: ${error.message}`)
      }
    }
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
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
                <p className="text-sm text-gray-500">Manage supplier information and relationships</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search suppliers..."
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
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
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
                  Supplier Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
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
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      <div className="text-sm text-gray-500">{supplier.code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{supplier.contactPerson}</div>
                    <div className="text-sm text-gray-500">{supplier.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {getRatingStars(supplier.rating)}
                        <span className="text-sm text-gray-600">({supplier.rating})</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{supplier.totalOrders}</div>
                    <div className="text-sm text-gray-500">₹{supplier.totalValue.toLocaleString('en-IN')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(supplier.status)}`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier Name *</label>
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
                    <label className="block text-sm font-medium text-gray-700">Supplier Code *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person *</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
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
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
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
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
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
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <input
                      type="number"
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                      min="0"
                      max="5"
                      step="0.1"
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
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                    <select
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    >
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Terms</label>
                    <select
                      name="deliveryTerms"
                      value={formData.deliveryTerms}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    >
                      <option value="EXW">EXW</option>
                      <option value="FOB">FOB</option>
                      <option value="CIF">CIF</option>
                      <option value="DDP">DDP</option>
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
                    placeholder="Any additional information about the supplier..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingSupplier(null)
                      resetForm()
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
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

export default SupplierList
