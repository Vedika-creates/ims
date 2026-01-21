import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, TrendingUp, TrendingDown, Package, DollarSign, Users, ShoppingCart, AlertTriangle, Download, FileText, Calendar, Filter } from 'lucide-react'
import { api } from '../../services/api'

const Reports = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30days')
  const [reports, setReports] = useState({
    overview: {},
    stockStatus: [],
    lowStock: [],
    supplierPerformance: [],
    abcAnalysis: [],
    stockAging: []
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadReports()
  }, [activeTab, dateRange])

  const loadReports = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'overview':
          await loadOverview()
          break
        case 'stockStatus':
          await loadStockStatus()
          break
        case 'lowStock':
          await loadLowStock()
          break
        case 'supplierPerformance':
          await loadSupplierPerformance()
          break
        case 'abcAnalysis':
          await loadABCAnalysis()
          break
        case 'stockAging':
          await loadStockAging()
          break
      }
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOverview = async () => {
    try {
      const [inventoryResponse, suppliersResponse, ordersResponse] = await Promise.all([
        api.get('/inventory'),
        api.get('/suppliers'),
        api.get('/purchase-orders')
      ])

      const inventory = inventoryResponse.data
      const suppliers = suppliersResponse.data
      const orders = ordersResponse.data

      const totalValue = inventory.reduce((sum, item) => sum + (item.current_stock * (item.cost || 100)), 0)
      const totalOrders = orders.length
      const approvedOrders = orders.filter(po => po.status === 'APPROVED').length
      const pendingOrders = orders.filter(po => po.status === 'DRAFT').length

      setReports(prev => ({
        ...prev,
        overview: {
          totalItems: inventory.length,
          totalValue: totalValue,
          totalSuppliers: suppliers.length,
          totalOrders: totalOrders,
          approvedOrders: approvedOrders,
          pendingOrders: pendingOrders,
          lowStockItems: inventory.filter(item => item.current_stock <= item.reorder_point).length,
          outOfStockItems: inventory.filter(item => item.current_stock === 0).length
        }
      }))
    } catch (error) {
      console.error('Failed to load overview:', error)
    }
  }

  const loadStockStatus = async () => {
    try {
      const response = await api.get('/inventory')
      const inventory = response.data

      const stockStatus = inventory.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        currentStock: item.current_stock,
        reorderPoint: item.reorder_point,
        status: item.current_stock === 0 ? 'out_of_stock' : 
                item.current_stock <= item.reorder_point ? 'low_stock' : 'normal',
        value: item.current_stock * (item.cost || 100),
        category: item.category_name || 'Uncategorized',
        supplier: item.supplier_name || 'Unknown'
      }))

      setReports(prev => ({
        ...prev,
        stockStatus
      }))
    } catch (error) {
      console.error('Failed to load stock status:', error)
    }
  }

  const loadLowStock = async () => {
    try {
      const response = await api.get('/inventory')
      const inventory = response.data

      const lowStockItems = inventory
        .filter(item => item.current_stock <= item.reorder_point)
        .sort((a, b) => (a.current_stock / a.reorder_point) - (b.current_stock / b.reorder_point))
        .map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          currentStock: item.current_stock,
          reorderPoint: item.reorder_point,
          shortage: item.reorder_point - item.current_stock,
          urgency: item.current_stock === 0 ? 'critical' : 'high',
          value: item.current_stock * (item.cost || 100),
          supplier: item.supplier_name || 'Unknown'
        }))
      
      setReports(prev => ({
        ...prev,
        lowStock: lowStockItems
      }))
    } catch (error) {
      console.error('Failed to load low stock:', error)
    }
  }

  const loadSupplierPerformance = async () => {
    try {
      const [suppliersResponse, ordersResponse] = await Promise.all([
        api.get('/suppliers'),
        api.get('/purchase-orders')
      ])

      const suppliers = suppliersResponse.data
      const orders = ordersResponse.data

      const supplierPerformance = suppliers.map(supplier => {
        const supplierOrders = orders.filter(po => po.supplier_id === supplier.id)
        const totalValue = supplierOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0)
        const avgOrderValue = supplierOrders.length > 0 ? totalValue / supplierOrders.length : 0

        return {
          id: supplier.id,
          name: supplier.name,
          totalOrders: supplierOrders.length,
          totalValue: totalValue,
          avgOrderValue: avgOrderValue,
          performance: supplierOrders.length >= 5 ? 'excellent' : supplierOrders.length >= 3 ? 'good' : 'needs_improvement'
        }
      })

      setReports(prev => ({
        ...prev,
        supplierPerformance
      }))
    } catch (error) {
      console.error('Failed to load supplier performance:', error)
    }
  }

  const loadABCAnalysis = async () => {
    try {
      const response = await api.get('/inventory')
      const inventory = response.data

      const totalValue = inventory.reduce((sum, item) => sum + (item.current_stock * (item.cost || 100)), 0)
      
      const abcAnalysis = inventory.map(item => {
        const itemValue = item.current_stock * (item.cost || 100)
        const percentage = totalValue > 0 ? (itemValue / totalValue) * 100 : 0
        
        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category_name || 'Uncategorized',
          currentValue: itemValue,
          percentage: percentage,
          classification: percentage >= 80 ? 'A' : percentage >= 20 ? 'B' : 'C'
        }
      }).sort((a, b) => b.percentage - a.percentage)

      setReports(prev => ({
        ...prev,
        abcAnalysis: abcAnalysis
      }))
    } catch (error) {
      console.error('Failed to load ABC analysis:', error)
    }
  }

  const loadStockAging = async () => {
    try {
      const response = await api.get('/inventory')
      const inventory = response.data

      const stockAging = inventory.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        currentStock: item.current_stock,
        value: item.current_stock * (item.cost || 100),
        category: item.category_name || 'Uncategorized',
        aging: item.current_stock > 0 ? 'fresh' : 'unknown' // Would need last_received_date for proper aging
      }))

      setReports(prev => ({
        ...prev,
        stockAging
      }))
    } catch (error) {
      console.error('Failed to load stock aging:', error)
    }
  }

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0]).join(',')
    const csvContent = [
      headers,
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const renderOverview = () => {
    const { overview } = reports
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{overview.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{overview.totalValue?.toLocaleString('en-IN') || '0'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{overview.totalSuppliers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ShoppingCart className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{overview.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{overview.lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Out of Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{overview.outOfStockItems}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderStockStatus = () => {
    const { stockStatus } = reports
    
    const getStatusColor = (status) => {
      switch (status) {
        case 'out_of_stock': return 'bg-red-100 text-red-800'
        case 'low_stock': return 'bg-yellow-100 text-yellow-800'
        default: return 'bg-green-100 text-green-800'
      }
    }

    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Stock Status Report</h2>
            <button
              onClick={() => exportToCSV(stockStatus, 'stock-status-report')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Point</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockStatus.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status === 'out_of_stock' ? 'Out of Stock' : item.status === 'low_stock' ? 'Low Stock' : 'Normal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.reorderPoint}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{item.value.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderLowStock = () => {
    const { lowStock } = reports

    const getUrgencyColor = (urgency) => {
      switch (urgency) {
        case 'critical': return 'bg-red-100 text-red-800'
        case 'high': return 'bg-orange-100 text-orange-800'
        default: return 'bg-yellow-100 text-yellow-800'
      }
    }

    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Low Stock Alert Report</h2>
            <button
              onClick={() => exportToCSV(lowStock, 'low-stock-report')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Point</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shortage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lowStock.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.currentStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.reorderPoint}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-red-600 font-medium">{item.shortage}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(item.urgency)}`}>
                      {item.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{item.value.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderSupplierPerformance = () => {
    const { supplierPerformance } = reports

    const getPerformanceColor = (performance) => {
      switch (performance) {
        case 'excellent': return 'bg-green-100 text-green-800'
        case 'good': return 'bg-blue-100 text-blue-800'
        default: return 'bg-red-100 text-red-800'
      }
    }

    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Supplier Performance Report</h2>
            <button
              onClick={() => exportToCSV(supplierPerformance, 'supplier-performance-report')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supplierPerformance.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{supplier.totalOrders}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{supplier.totalValue.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{supplier.avgOrderValue.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceColor(supplier.performance)}`}>
                      {supplier.performance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderABCAnalysis = () => {
    const { abcAnalysis } = reports

    const getClassificationColor = (classification) => {
      switch (classification) {
        case 'A': return 'bg-green-100 text-green-800'
        case 'B': return 'bg-yellow-100 text-yellow-800'
        case 'C': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }

    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">ABC Analysis Report</h2>
            <button
              onClick={() => exportToCSV(abcAnalysis, 'abc-analysis-report')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classification</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {abcAnalysis.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{item.currentValue.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.percentage.toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassificationColor(item.classification)}`}>
                      {item.classification}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderStockAging = () => {
    const { stockAging } = reports

    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Stock Aging Report</h2>
            <button
              onClick={() => exportToCSV(stockAging, 'stock-aging-report')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aging Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockAging.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.currentStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{item.value.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {item.aging}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('stockStatus')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stockStatus' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4 mr-2" />
              Stock Status
            </button>
            <button
              onClick={() => setActiveTab('lowStock')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lowStock' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Low Stock Alert
            </button>
            <button
              onClick={() => setActiveTab('supplierPerformance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'supplierPerformance' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Supplier Performance
            </button>
            <button
              onClick={() => setActiveTab('abcAnalysis')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'abcAnalysis' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              ABC Analysis
            </button>
            <button
              onClick={() => setActiveTab('stockAging')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stockAging' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Stock Aging
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-blue-500"></div>
            </div>
          )}

          {!loading && (
            <div>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'stockStatus' && renderStockStatus()}
              {activeTab === 'lowStock' && renderLowStock()}
              {activeTab === 'supplierPerformance' && renderSupplierPerformance()}
              {activeTab === 'abcAnalysis' && renderABCAnalysis()}
              {activeTab === 'stockAging' && renderStockAging()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports