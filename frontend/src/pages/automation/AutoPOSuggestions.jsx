import React, { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Search, Filter, Eye, CheckCircle, Clock, TrendingUp, Calculator, Package, AlertTriangle } from 'lucide-react'
import axios from 'axios'

const AutoPOSuggestions = () => {
  const [suggestions, setSuggestions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)

  const [loading, setLoading] = useState(false)
  const [autoCreatedPRs, setAutoCreatedPRs] = useState([])

  // Fetch suggestions on component mount
  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/purchase-requisitions/run-auto-suggestions`, {
        auto_create_critical: false
      })
      
      if (response.data.success) {
        setSuggestions(response.data.suggestions)
        setAutoCreatedPRs([])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      // Fallback to empty array if API fails
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  // Run suggestions with auto-creation for critical stock
  const runSuggestions = async () => {
    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/purchase-requisitions/run-auto-suggestions`, {
        auto_create_critical: true
      })
      
      if (response.data.success) {
        setSuggestions(response.data.suggestions)
        setAutoCreatedPRs(response.data.auto_created_prs || [])
        
        // Show success message for auto-created PRs
        if (response.data.auto_created_prs?.length > 0) {
          alert(`Auto-created ${response.data.auto_created_prs.length} PRs for critical stock items`)
        }
      }
    } catch (error) {
      console.error('Error running suggestions:', error)
      alert('Error running suggestions: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesSearch = suggestion.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         suggestion.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         suggestion.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || suggestion.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const handleViewDetails = (suggestion) => {
    setSelectedSuggestion(suggestion)
    setShowDetailsModal(true)
  }

  const handleApprove = (suggestionId) => {
    setSuggestions(prev => prev.map(suggestion =>
      suggestion.id === suggestionId
        ? { 
            ...suggestion, 
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: 'Current User'
          }
        : suggestion
    ))
  }

  const handleReject = (suggestionId) => {
    const reason = prompt('Please provide rejection reason:')
    if (reason) {
      setSuggestions(prev => prev.map(suggestion =>
        suggestion.id === suggestionId
          ? { 
              ...suggestion, 
              status: 'rejected',
              rejectedAt: new Date().toISOString(),
              rejectedBy: 'Current User',
              rejectionReason: reason
            }
          : suggestion
      ))
    }
  }

  // Create PR manually for a suggestion
  const createPR = async (suggestion) => {
    try {
      const response = await axios.post(`${API_URL}/purchase-requisitions`, {
        requestedBy: 'Current User',
        items: [{
          id: suggestion.itemId,
          quantity: suggestion.suggestedQuantity,
          unitPrice: suggestion.unitPrice
        }]
      })
      
      if (response.data) {
        // Update the suggestion status to show PR was created
        setSuggestions(prev => prev.map(s =>
          s.id === suggestion.id
            ? { ...s, status: 'pr_created', prNumber: response.data.prNumber }
            : s
        ))
        alert(`PR ${response.data.prNumber} created successfully for ${suggestion.itemName}`)
      }
    } catch (error) {
      console.error('Error creating PR:', error)
      alert('Error creating PR: ' + (error.response?.data?.error || error.message))
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'pr_created': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStockStatus = (current, reorderPoint, safetyStock) => {
    if (current <= safetyStock) return { color: 'red', text: 'Critical', icon: AlertTriangle }
    if (current <= reorderPoint) return { color: 'yellow', text: 'Low', icon: TrendingUp }
    return { color: 'green', text: 'Good', icon: Package }
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Auto PO Suggestions</h1>
                <p className="text-sm text-gray-500">AI-powered purchase order recommendations based on demand forecasting</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={runSuggestions}
                disabled={loading}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>{loading ? 'Running...' : 'Run Suggestions'}</span>
              </button>
              <button
                onClick={fetchSuggestions}
                disabled={loading}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                {suggestions.filter(s => s.status === 'pending').length} Pending Review
              </span>
              {autoCreatedPRs.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {autoCreatedPRs.length} PRs Auto-Created
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search suggestions..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
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
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suggestion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Analysis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
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
              {filteredSuggestions.map((suggestion) => {
                const stockStatus = getStockStatus(suggestion.currentStock, suggestion.reorderPoint, suggestion.safetyStock)
                const StatusIcon = stockStatus.icon
                
                return (
                  <tr key={suggestion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{suggestion.itemName}</div>
                        <div className="text-sm text-gray-500">SKU: {suggestion.sku}</div>
                        <div className="text-xs text-gray-400">{suggestion.supplier}</div>
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
                            {suggestion.currentStock} units
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Qty: {suggestion.suggestedQuantity}</div>
                        <div>Date: {suggestion.suggestedDate || 'N/A'}</div>
                        <div>Cost: ${suggestion.totalCost.toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Calculator className="w-4 h-4 text-gray-400" />
                          <span>{suggestion.calculationMethod.replace('_', ' ')}</span>
                          <span className={`font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                            {suggestion.confidence}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Demand: {suggestion.avgMonthlyDemand}/mo
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                        {suggestion.status}
                      </span>
                      {suggestion.approvedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          by {suggestion.approvedBy}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(suggestion)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {suggestion.status === 'pending' && (
                          <>
                            <button
                              onClick={() => createPR(suggestion)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Create PR"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApprove(suggestion.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(suggestion.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {suggestion.status === 'pr_created' && (
                          <span className="text-xs text-green-600 font-medium">
                            PR: {suggestion.prNumber}
                          </span>
                        )}
                        {suggestion.status === 'approved' && !suggestion.poGenerated && (
                          <button
                            onClick={() => handleGeneratePO(suggestion.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailsModal && selectedSuggestion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">PO Suggestion Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <Clock className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Item</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedSuggestion.itemName}</p>
                  <p className="text-sm text-gray-600">{selectedSuggestion.sku}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Suggestion</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedSuggestion.suggestedQuantity} units</p>
                  <p className="text-sm text-gray-600">${selectedSuggestion.totalCost.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Priority</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedSuggestion.priority)}`}>
                    {selectedSuggestion.priority}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">Confidence: {selectedSuggestion.confidence}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSuggestion.status)}`}>
                    {selectedSuggestion.status}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedSuggestion.suggestedDate && `Suggested: ${selectedSuggestion.suggestedDate}`}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">AI Analysis & Reasoning</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{selectedSuggestion.reasoning}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Stock Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSuggestion.currentStock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reorder Point:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSuggestion.reorderPoint} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Safety Stock:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSuggestion.safetyStock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Monthly Demand:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSuggestion.avgMonthlyDemand} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Lead Time:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSuggestion.leadTime} days</span>
                    </div>
                    {selectedSuggestion.lastStockout && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Stockout:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedSuggestion.lastStockout}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Calculation Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Method:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSuggestion.calculationMethod.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Unit Price:</span>
                      <span className="text-sm font-medium text-gray-900">${selectedSuggestion.unitPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Seasonality:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSuggestion.seasonality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium text-gray-900">{new Date(selectedSuggestion.created).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Expires:</span>
                      <span className="text-sm font-medium text-gray-900">{new Date(selectedSuggestion.expires).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedSuggestion.rejectionReason && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Rejection Reason</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">{selectedSuggestion.rejectionReason}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                {selectedSuggestion.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleReject(selectedSuggestion.id)
                        setShowDetailsModal(false)
                      }}
                      className="btn btn-danger"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        handleApprove(selectedSuggestion.id)
                        setShowDetailsModal(false)
                      }}
                      className="btn btn-success"
                    >
                      Approve
                    </button>
                  </>
                )}
                {selectedSuggestion.status === 'approved' && !selectedSuggestion.poGenerated && (
                  <button
                    onClick={() => {
                      handleGeneratePO(selectedSuggestion.id)
                      setShowDetailsModal(false)
                    }}
                    className="btn btn-primary"
                  >
                    Generate PO
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutoPOSuggestions
