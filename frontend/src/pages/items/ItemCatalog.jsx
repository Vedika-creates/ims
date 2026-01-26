import React, { useState, useEffect } from 'react'
import { Package, Plus, Edit, Trash2, Search, Filter, AlertTriangle, TrendingUp, TrendingDown, Eye, Download } from 'lucide-react'
import { inventoryService } from '../../services/inventoryService'

const API_URL = 'https://ims-0i8n.onrender.com/api'

const ItemCatalog = () => {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category_id: '',
    lead_time_days: 0,
    safety_stock: 0,
    reorder_point: 0,
    is_batch_tracked: false,
    is_expiry_tracked: false,
    opening_stock: 0,
    cost: 0,
    selling_price: 0,
    supplier_id: null,
    warehouse_id: null
  })

  useEffect(() => {
    // Load real data from API
    const loadData = async () => {
      try {
        const [itemsData, categoriesData, suppliersData, warehousesData] = await Promise.all([
          inventoryService.getItems(),
          fetch(`${API_URL}/categories`).then(res => res.json()),
          fetch(`${API_URL}/suppliers`).then(res => res.json()),
          fetch(`${API_URL}/warehouses`).then(res => res.json())
        ])
        
        console.log('Fresh items data:', itemsData);
        console.log('Fresh categories data:', categoriesData);
        console.log('Fresh suppliers data:', suppliersData);
        console.log('Fresh warehouses data:', warehousesData);
        
        setItems(itemsData)
        setCategories(categoriesData)
        setSuppliers(suppliersData)
        setWarehouses(warehousesData)
      } catch (error) {
        console.error('Failed to load data:', error)
        // Fallback to empty arrays if API fails
        setItems([])
        setCategories([])
        setSuppliers([])
        setWarehouses([])
      }
    }
    
    loadData()
  }, [])

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || item.category_name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredCategories = categories.filter(cat => 
    selectedCategory === 'all' || cat.name === selectedCategory
  )

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  // Map frontend field names to backend column names before sending
  const mapPayloadToBackend = (data) => {
    const { id, category_name, location_code, stock_status, total_value, supplier, warehouse, ...rest } = data
    console.log('Mapping payload to backend:', rest)
    return {
      ...rest,
      supplier_id: rest.supplier_id || supplier || null,
      warehouse_id: rest.warehouse_id || warehouse || null,
      requires_batch_tracking: rest.is_batch_tracked || false,
      requires_serial_tracking: rest.serialTracking || false,
      has_expiry: rest.is_expiry_tracked || false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = mapPayloadToBackend(formData)
      console.log('Submitting payload:', payload);
      if (editingItem) {
        // Update existing item
        console.log('Updating item:', editingItem.id, payload);
        const updatedItem = await inventoryService.updateItem(editingItem.id, payload)
        console.log('Update response:', updatedItem);
        setItems(prev => prev.map(item =>
          item.id === editingItem.id ? updatedItem : item
        ))
      } else {
        // Create new item
        console.log('Creating new item:', payload);
        const newItem = await inventoryService.createItem(payload)
        console.log('Create response:', newItem);
        setItems(prev => [...prev, newItem])
      }
      setShowAddModal(false)
      setEditingItem(null)
      resetForm()
    } catch (error) {
      console.error('Failed to save item:', error)
      alert('Failed to save item. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category_id: '',
      lead_time_days: 0,
      safety_stock: 0,
      reorder_point: 0,
      is_batch_tracked: false,
      is_expiry_tracked: false,
      opening_stock: 0,
      cost: 0,
      selling_price: 0,
      supplier_id: null,
      warehouse_id: null
    })
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    // Exclude id and virtual fields when populating form for editing
    const { id, category_name, location_code, stock_status, total_value, supplier_name, warehouse_name, ...formDataWithoutId } = item
    // Ensure category_id and pricing/stock fields are properly set from the item data
    setFormData({
      ...formDataWithoutId,
      category_id: item.category_id || '',
      opening_stock: item.opening_stock ?? item.current_stock ?? 0,
      selling_price: item.selling_price ?? item.sellingprice ?? item.unit_price ?? 0
    })
    setShowAddModal(true)
  }

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return

    try {
      console.log('🗑️ Deleting item:', itemId)
      await inventoryService.deleteItem(itemId)
      console.log('✅ Item deleted successfully, refreshing list...')
      
      // Remove from local state immediately for better UX
      setItems(prev => prev.filter(item => item.id !== itemId))
      
      // Then refresh from server to ensure consistency
      const refreshedItems = await inventoryService.getItems()
      setItems(refreshedItems)
      console.log('✅ List refreshed, items count:', refreshedItems.length)
    } catch (error) {
      console.error('❌ Failed to delete item:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      // Refresh list to show current state
      try {
        const refreshedItems = await inventoryService.getItems()
        setItems(refreshedItems)
      } catch (refreshError) {
        console.error('❌ Failed to refresh list:', refreshError)
      }
      
      alert(`Failed to delete item: ${error.response?.data?.error || error.message}`)
    }
  }

  const getStockStatus = (currentStock, reorderPoint, safetyStock) => {
    if (currentStock <= safetyStock) return { color: 'red', text: 'Critical', icon: AlertTriangle }
    if (currentStock <= reorderPoint) return { color: 'yellow', text: 'Low', icon: TrendingDown }
    return { color: 'green', text: 'Good', icon: TrendingUp }
  }

  const exportToCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Current Stock', 'Safety Stock', 'Reorder Point', 'Cost', 'Status']
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => [
        item.sku,
        item.name,
        item.category,
        item.current_stock,
        item.safetyStock,
        item.reorderPoint,
        item.cost,
        item.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'item_catalog.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Item Catalog</h1>
                <p className="text-sm text-gray-500">Manage inventory items and stock levels</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToCSV}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
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
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Levels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const currentStock = Number(item.current_stock ?? item.opening_stock ?? 0)
                const safetyStock = Number(item.safety_stock ?? 0)
                const reorderPoint = Number(item.reorder_point ?? 0)
                const costValue = Number(item.cost ?? item.unit_cost ?? 0)
                const sellingValue = Number(item.selling_price ?? item.sellingprice ?? item.sellingPrice ?? item.unit_price ?? 0)
                const stockStatus = getStockStatus(currentStock, reorderPoint, safetyStock)
                const StatusIcon = stockStatus.icon
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                        <div className="text-xs text-gray-400">{item.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.category_name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-4 h-4 text-${stockStatus.color}-500`} />
                        <span className={`text-sm font-medium text-${stockStatus.color}-700`}>
                          {item.stock_status || 'Normal'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Current: {currentStock.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">
                          Safety: {safetyStock.toLocaleString()} | Reorder: {reorderPoint.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Cost: ₹{costValue.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Sell: ₹{sellingValue.toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-primary-600 hover:text-primary-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
          <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <label className="block text-sm font-medium text-gray-700">Item Name *</label>
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
                    <label className="block text-sm font-medium text-gray-700">Category *</label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lead Time (days)</label>
                    <input
                      type="number"
                      name="lead_time_days"
                      value={formData.lead_time_days}
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
                      <option value="Discontinued">Discontinued</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Safety Stock</label>
                    <input
                      type="number"
                      name="safety_stock"
                      value={formData.safety_stock}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reorder Point</label>
                    <input
                      type="number"
                      name="reorder_point"
                      value={formData.reorder_point}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Stock</label>
                    <input
                      type="number"
                      name="max_stock"
                      value={formData.max_stock}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Opening Stock</label>
                    <input
                      type="number"
                      name="opening_stock"
                      value={formData.opening_stock}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cost (₹)</label>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Selling Price (₹)</label>
                    <input
                      type="number"
                      name="selling_price"
                      value={formData.selling_price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                    <select
                      name="supplier_id"
                      value={formData.supplier_id || ''}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                    <select
                      name="warehouse_id"
                      value={formData.warehouse_id || ''}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Tracking Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="batchTracking"
                        checked={formData.batchTracking}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Batch Tracking</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="serialTracking"
                        checked={formData.serialTracking}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Serial Tracking</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="expiryTracking"
                        checked={formData.expiryTracking}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Expiry Tracking</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingItem(null)
                      resetForm()
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? 'Update Item' : 'Add Item'}
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

export default ItemCatalog
