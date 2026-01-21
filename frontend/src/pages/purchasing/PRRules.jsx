import React, { useState, useEffect } from 'react'
import { Settings, Plus, Edit, Trash2, Play, Clock, AlertCircle, Package, Calendar, Filter, Search } from 'lucide-react'
import { api } from '../../services/api'

const PRRules = () => {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRuleType, setSelectedRuleType] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRule, setSelectedRule] = useState(null)
  const [executing, setExecuting] = useState(false)
  
  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'STOCK_LEVEL',
    trigger_condition: {},
    action_config: {},
    priority: 1,
    is_active: true,
    item_mappings: []
  })

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await api.get('/pr-rules')
      setRules(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch rules:', error)
      setLoading(false)
    }
  }

  const executeRules = async () => {
    setExecuting(true)
    try {
      const response = await api.post('/pr-rules/execute')
      console.log('✅ Rules executed:', response.data)
      alert(`Successfully generated ${response.data.generated_prs?.length || 0} purchase requisitions from rules!`)
      
      // Refresh rules to see execution history
      fetchRules()
    } catch (error) {
      console.error('Failed to execute rules:', error)
      alert('Failed to execute rules')
    } finally {
      setExecuting(false)
    }
  }

  const handleCreateRule = async () => {
    try {
      const response = await api.post('/pr-rules', {
        ...formData,
        created_by: '16b98519-3557-41c1-8619-164c03f612da'
      })
      console.log('✅ Rule created:', response.data)
      
      setRules(prev => [response.data, ...prev])
      setShowCreateModal(false)
      resetForm()
      alert('Rule created successfully!')
    } catch (error) {
      console.error('Failed to create rule:', error)
      alert('Failed to create rule')
    }
  }

  const handleUpdateRule = async () => {
    try {
      const response = await api.put(`/pr-rules/${selectedRule.id}`, formData)
      console.log('✅ Rule updated:', response.data)
      
      setRules(prev => prev.map(rule => 
        rule.id === selectedRule.id ? response.data : rule
      ))
      setShowEditModal(false)
      resetForm()
      alert('Rule updated successfully!')
    } catch (error) {
      console.error('Failed to update rule:', error)
      alert('Failed to update rule')
    }
  }

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    
    try {
      await api.delete(`/pr-rules/${ruleId}`)
      console.log('✅ Rule deleted:', ruleId)
      
      setRules(prev => prev.filter(rule => rule.id !== ruleId))
      alert('Rule deleted successfully!')
    } catch (error) {
      console.error('Failed to delete rule:', error)
      alert('Failed to delete rule')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'STOCK_LEVEL',
      trigger_condition: {},
      action_config: {},
      priority: 1,
      is_active: true,
      item_mappings: []
    })
    setSelectedRule(null)
  }

  const openEditModal = (rule) => {
    setSelectedRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description,
      rule_type: rule.rule_type,
      trigger_condition: rule.trigger_condition,
      action_config: rule.action_config,
      priority: rule.priority,
      is_active: rule.is_active,
      item_mappings: rule.item_mappings || []
    })
    setShowEditModal(true)
  }

  const getRuleTypeIcon = (type) => {
    switch (type) {
      case 'STOCK_LEVEL': return <Package className="w-4 h-4 text-blue-500" />
      case 'TIME_BASED': return <Calendar className="w-4 h-4 text-green-500" />
      case 'CATEGORY_BASED': return <Filter className="w-4 h-4 text-purple-500" />
      default: return <Settings className="w-4 h-4 text-gray-500" />
    }
  }

  const getRuleTypeLabel = (type) => {
    switch (type) {
      case 'STOCK_LEVEL': return 'Stock Level'
      case 'TIME_BASED': return 'Time Based'
      case 'CATEGORY_BASED': return 'Category Based'
      default: return 'Unknown'
    }
  }

  const getPriorityColor = (priority) => {
    if (priority <= 2) return 'bg-red-100 text-red-800'
    if (priority <= 5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedRuleType === 'all' || rule.rule_type === selectedRuleType
    return matchesSearch && matchesType
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Purchase Requisition Rules</h1>
          <button
            onClick={executeRules}
            disabled={executing}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>{executing ? 'Executing...' : 'Execute Rules'}</span>
          </button>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Rule</span>
        </button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search rules..."
            className="input-field pl-10 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          className="input-field w-48"
          value={selectedRuleType}
          onChange={(e) => setSelectedRuleType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="STOCK_LEVEL">Stock Level</option>
          <option value="TIME_BASED">Time Based</option>
          <option value="CATEGORY_BASED">Category Based</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading rules...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                      <div className="text-sm text-gray-500">{rule.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getRuleTypeIcon(rule.rule_type)}
                      <span className="text-sm text-gray-900">
                        {getRuleTypeLabel(rule.rule_type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(rule.priority)}`}>
                      Priority {rule.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(rule)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
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
          
          {filteredRules.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No rules found</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Rule Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {showCreateModal ? 'Create New Rule' : 'Edit Rule'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowEditModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter rule name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Type</label>
                  <select
                    className="input-field"
                    value={formData.rule_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, rule_type: e.target.value }))}
                  >
                    <option value="STOCK_LEVEL">Stock Level</option>
                    <option value="TIME_BASED">Time Based</option>
                    <option value="CATEGORY_BASED">Category Based</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter rule description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    className="input-field"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  >
                    <option value={1}>1 (Highest)</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                    <option value={7}>7</option>
                    <option value={8}>8</option>
                    <option value={9}>9</option>
                    <option value={10}>10 (Lowest)</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowEditModal(false)
                    resetForm()
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={showCreateModal ? handleCreateRule : handleUpdateRule}
                  className="btn btn-primary"
                >
                  {showCreateModal ? 'Create Rule' : 'Update Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PRRules
