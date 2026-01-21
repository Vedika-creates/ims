import React, { useState, useEffect } from 'react'
import { Settings, Plus, Search, Filter, Edit, Trash2, AlertTriangle, TrendingUp, Calculator, Package } from 'lucide-react'

const ReorderRules = () => {
  const [rules, setRules] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [formData, setFormData] = useState({
    itemName: '',
    sku: '',
    ruleType: 'min_max',
    minStock: 0,
    maxStock: 0,
    reorderQuantity: 0,
    reorderPoint: 0,
    safetyStock: 0,
    leadTime: 0,
    calculationMethod: 'static',
    demandPeriod: 30,
    supplier: '',
    warehouse: '',
    autoApprove: false,
    status: 'Active'
  })

  const ruleTypes = ['min_max', 'reorder_point', 'dynamic', 'seasonal']
  const calculationMethods = ['static', 'historical', 'forecast', 'abc_analysis']
  const warehouses = ['Warehouse A', 'Warehouse B', 'Warehouse C']

  useEffect(() => {
    // Mock data - replace with API call
    const mockRules = [
      {
        id: 1,
        itemName: 'Laptop Dell Latitude',
        sku: 'LAP-001',
        ruleType: 'min_max',
        minStock: 10,
        maxStock: 100,
        reorderQuantity: 50,
        reorderPoint: 15,
        safetyStock: 10,
        leadTime: 14,
        calculationMethod: 'historical',
        demandPeriod: 30,
        supplier: 'Tech Supplies Inc',
        warehouse: 'Warehouse A',
        autoApprove: true,
        status: 'Active',
        lastTriggered: '2024-01-10',
        currentStock: 25,
        nextReorderDate: '2024-01-20',
        avgMonthlyDemand: 45,
        createdAt: '2023-06-15T09:00:00Z'
      },
      {
        id: 2,
        itemName: 'A4 Paper Pack',
        sku: 'PAP-002',
        ruleType: 'reorder_point',
        minStock: 50,
        maxStock: 500,
        reorderQuantity: 100,
        reorderPoint: 75,
        safetyStock: 50,
        leadTime: 7,
        calculationMethod: 'static',
        demandPeriod: 30,
        supplier: 'Office Depot',
        warehouse: 'Warehouse B',
        autoApprove: false,
        status: 'Active',
        lastTriggered: '2024-01-08',
        currentStock: 60,
        nextReorderDate: '2024-01-18',
        avgMonthlyDemand: 120,
        createdAt: '2023-07-20T14:30:00Z'
      },
      {
        id: 3,
        itemName: 'Steel Rod 10mm',
        sku: 'RAW-003',
        ruleType: 'dynamic',
        minStock: 100,
        maxStock: 1000,
        reorderQuantity: 500,
        reorderPoint: 150,
        safetyStock: 100,
        leadTime: 21,
        calculationMethod: 'forecast',
        demandPeriod: 30,
        supplier: 'Metal Works Ltd',
        warehouse: 'Warehouse C',
        autoApprove: false,
        status: 'Active',
        lastTriggered: '2024-01-05',
        currentStock: 80,
        nextReorderDate: '2024-01-15',
        avgMonthlyDemand: 200,
        createdAt: '2023-08-10T11:15:00Z'
      },
      {
        id: 4,
        itemName: 'Monitor 24 inch',
        sku: 'MON-002',
        ruleType: 'seasonal',
        minStock: 20,
        maxStock: 200,
        reorderQuantity: 100,
        reorderPoint: 30,
        safetyStock: 20,
        leadTime: 14,
        calculationMethod: 'abc_analysis',
        demandPeriod: 90,
        supplier: 'Tech Supplies Inc',
        warehouse: 'Warehouse A',
        autoApprove: true,
        status: 'Inactive',
        lastTriggered: '2023-12-15',
        currentStock: 45,
        nextReorderDate: null,
        avgMonthlyDemand: 60,
        createdAt: '2023-09-05T16:45:00Z'
      }
    ]
    setRules(mockRules)
  }, [])

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || rule.status === selectedStatus
    return matchesSearch && matchesStatus
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
    if (editingRule) {
      setRules(prev => prev.map(rule =>
        rule.id === editingRule.id
          ? { ...rule, ...formData }
          : rule
      ))
    } else {
      const newRule = {
        id: rules.length + 1,
        ...formData,
        lastTriggered: null,
        currentStock: 0,
        nextReorderDate: null,
        avgMonthlyDemand: 0,
        createdAt: new Date().toISOString()
      }
      setRules(prev => [...prev, newRule])
    }
    setShowAddModal(false)
    setEditingRule(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      itemName: '',
      sku: '',
      ruleType: 'min_max',
      minStock: 0,
      maxStock: 0,
      reorderQuantity: 0,
      reorderPoint: 0,
      safetyStock: 0,
      leadTime: 0,
      calculationMethod: 'static',
      demandPeriod: 30,
      supplier: '',
      warehouse: '',
      autoApprove: false,
      status: 'Active'
    })
  }

  const handleEdit = (rule) => {
    setEditingRule(rule)
    setFormData(rule)
    setShowAddModal(true)
  }

  const handleDelete = (ruleId) => {
    if (window.confirm('Are you sure you want to delete this reorder rule?')) {
      setRules(prev => prev.filter(rule => rule.id !== ruleId))
    }
  }

  const handleToggleStatus = (ruleId) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId
        ? { ...rule, status: rule.status === 'Active' ? 'Inactive' : 'Active' }
        : rule
    ))
  }

  const getRuleTypeColor = (type) => {
    switch (type) {
      case 'min_max': return 'bg-blue-100 text-blue-800'
      case 'reorder_point': return 'bg-green-100 text-green-800'
      case 'dynamic': return 'bg-purple-100 text-purple-800'
      case 'seasonal': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockStatus = (currentStock, reorderPoint, safetyStock) => {
    if (currentStock <= safetyStock) return { color: 'red', text: 'Critical', icon: AlertTriangle }
    if (currentStock <= reorderPoint) return { color: 'yellow', text: 'Low', icon: TrendingUp }
    return { color: 'green', text: 'Good', icon: Package }
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reorder Rules</h1>
                <p className="text-sm text-gray-500">Configure automated reorder rules and inventory optimization</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rule</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search rules..."
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
                  Rule Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Levels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Reorder
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
              {filteredRules.map((rule) => {
                const stockStatus = getStockStatus(rule.currentStock, rule.reorderPoint, rule.safetyStock)
                const StatusIcon = stockStatus.icon
                
                return (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rule.itemName}</div>
                        <div className="text-sm text-gray-500">SKU: {rule.sku}</div>
                        <div className="text-xs text-gray-400">{rule.supplier} • {rule.warehouse}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRuleTypeColor(rule.ruleType)}`}>
                        {rule.ruleType.replace('_', ' ')}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {rule.calculationMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Min: {rule.minStock}</div>
                        <div>Max: {rule.maxStock}</div>
                        <div>Reorder: {rule.reorderQuantity}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-4 h-4 text-${stockStatus.color}-500`} />
                        <div>
                          <div className={`text-sm font-medium text-${stockStatus.color}-700`}>
                            {stockStatus.text}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rule.currentStock} units
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{rule.nextReorderDate || 'Not scheduled'}</div>
                        <div className="text-xs text-gray-500">
                          Last: {rule.lastTriggered || 'Never'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(rule.id)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                          rule.status === 'Active' ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            rule.status === 'Active' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(rule)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
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
                {editingRule ? 'Edit Reorder Rule' : 'Add New Reorder Rule'}
              </h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Name *</label>
                    <input
                      type="text"
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                      required
                    />
                  </div>
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
                    <label className="block text-sm font-medium text-gray-700">Rule Type *</label>
                    <select
                      name="ruleType"
                      value={formData.ruleType}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    >
                      {ruleTypes.map(type => (
                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Calculation Method</label>
                    <select
                      name="calculationMethod"
                      value={formData.calculationMethod}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    >
                      {calculationMethods.map(method => (
                        <option key={method} value={method}>{method.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Min Stock</label>
                    <input
                      type="number"
                      name="minStock"
                      value={formData.minStock}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Stock</label>
                    <input
                      type="number"
                      name="maxStock"
                      value={formData.maxStock}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reorder Point</label>
                    <input
                      type="number"
                      name="reorderPoint"
                      value={formData.reorderPoint}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reorder Quantity</label>
                    <input
                      type="number"
                      name="reorderQuantity"
                      value={formData.reorderQuantity}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Safety Stock</label>
                    <input
                      type="number"
                      name="safetyStock"
                      value={formData.safetyStock}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lead Time (days)</label>
                    <input
                      type="number"
                      name="leadTime"
                      value={formData.leadTime}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Demand Period (days)</label>
                    <input
                      type="number"
                      name="demandPeriod"
                      value={formData.demandPeriod}
                      onChange={handleInputChange}
                      min="1"
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                    <input
                      type="text"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                    <select
                      name="warehouse"
                      value={formData.warehouse}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map(warehouse => (
                        <option key={warehouse} value={warehouse}>{warehouse}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="autoApprove"
                        checked={formData.autoApprove}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Auto-approve POs</div>
                        <div className="text-xs text-gray-500">Automatically approve purchase orders generated by this rule</div>
                      </div>
                    </label>
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
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingRule(null)
                      resetForm()
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingRule ? 'Update Rule' : 'Add Rule'}
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

export default ReorderRules
