import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Save, X } from 'lucide-react'
import { inventoryService } from '../../services/inventoryService'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const AddItem = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('newItemForm')
    const defaultData = {
      sku: '',
      name: '',
      description: '',
      category_id: '',
      lead_time_days: 0,
      safety_stock: 0,
      reorder_point: 0,
      cost: 0,
      selling_price: 0,
      supplier_id: null,
      warehouse_id: null,
      location: '',
      is_batch_tracked: false,
      serialTracking: false,
      is_expiry_tracked: false,
      status: 'Active'
    }

    try {
      return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData
    } catch (error) {
      console.error('Error parsing saved form data:', error)
      return defaultData
    }
  })

  const [categories, setCategories] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [metaError, setMetaError] = useState('')

  useEffect(() => {
    localStorage.setItem('newItemForm', JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    const loadMeta = async () => {
      try {
        setMetaError('')
        const [categoriesRes, suppliersRes, warehousesRes] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/suppliers`),
          fetch(`${API_URL}/warehouses`)
        ])

        const [categoriesData, suppliersData, warehousesData] = await Promise.all([
          categoriesRes.json(),
          suppliersRes.json(),
          warehousesRes.json()
        ])

        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : [])
        setWarehouses(Array.isArray(warehousesData) ? warehousesData : [])
      } catch (error) {
        console.error('Failed to load item metadata:', error)
        setMetaError('Failed to load categories, suppliers, or warehouses')
        setCategories([])
        setSuppliers([])
        setWarehouses([])
      }
    }

    loadMeta()
  }, [])

  const generateCostFromItemName = (itemName) => {
    if (!itemName) return 0

    const name = itemName.toLowerCase()
    const costPatterns = {
      laptop: 45000,
      computer: 35000,
      monitor: 15000,
      phone: 25000,
      tablet: 20000,
      keyboard: 1500,
      mouse: 800,
      printer: 12000,
      scanner: 8000,
      router: 3000,
      cable: 500,
      dock: 5000,
      headphone: 2000,
      speaker: 3000,
      camera: 15000,
      microphone: 1000
    }

    for (const [keyword, cost] of Object.entries(costPatterns)) {
      if (name.includes(keyword)) return cost
    }
    return 1000
  }

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target

    setFormData((prev) => {
      let updatedValue = value
      if (type === 'checkbox') {
        updatedValue = checked
      } else if (type === 'number') {
        updatedValue = value === '' ? '' : parseFloat(value) || 0
      }

      const updatedData = { ...prev, [name]: updatedValue }

      if (name === 'name') {
        const cost = generateCostFromItemName(value)
        updatedData.cost = cost
        if (!prev.selling_price || prev.selling_price === prev.cost * 1.2) {
          updatedData.selling_price = cost * 1.2
        }
      }

      return updatedData
    })
  }

  const validateForm = () => {
    const { sku, name, category_id, cost, selling_price, warehouse_id } = formData
    if (!sku || !name || !category_id) {
      alert('Please fill all required fields.')
      return false
    }
    if (!warehouse_id) {
      alert('Please select a warehouse.')
      return false
    }
    if (selling_price < cost) {
      alert('Selling price cannot be less than cost.')
      return false
    }
    return true
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    try {
      await inventoryService.createItem(formData)
      console.log('✅ Item Added:', formData)
      localStorage.removeItem('newItemForm')
      navigate('/items')
    } catch (error) {
      console.error('❌ Error saving item:', error)
      alert('Failed to save item. Please try again.')
    }
  }

  const handleCancel = () => {
    if (window.confirm('Discard unsaved changes?')) {
      localStorage.removeItem('newItemForm')
      navigate('/items')
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Items</span>
        </button>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Item</h1>
                <p className="text-sm text-gray-500">Create a new inventory item</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU *</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                  placeholder="e.g., LAP-001"
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
                  placeholder="e.g., Laptop Dell Latitude"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Cost auto-generates based on item type
                </p>
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
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 input-field"
                  placeholder="Detailed description..."
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  ['lead_time_days', 'Lead Time (days)'],
                  ['safety_stock', 'Safety Stock'],
                  ['reorder_point', 'Reorder Point']
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <input
                      type="number"
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <p className="mt-1 text-xs text-gray-500">
                    Auto-generated (can be overridden)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Selling Price (₹)
                  </label>
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
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location & Supplier</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Warehouse *</label>
                  <select
                    name="warehouse_id"
                    value={formData.warehouse_id || ''}
                    onChange={handleInputChange}
                    className="mt-1 input-field"
                    required
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
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
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tracking Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  ['is_batch_tracked', 'Batch Tracking', 'Track items by batch/lot numbers'],
                  ['serial_tracking', 'Serial Tracking', 'Track individual items by serial number'],
                  ['is_expiry_tracked', 'Expiry Tracking', 'Track expiration dates']
                ].map(([key, label, desc]) => (
                  <label
                    key={key}
                    className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name={key}
                      checked={formData[key]}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button type="submit" className="btn btn-primary flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save Item</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddItem
