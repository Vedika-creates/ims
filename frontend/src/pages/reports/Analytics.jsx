import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Package, DollarSign, Users, ShoppingCart, AlertTriangle, Activity } from 'lucide-react'
import { api } from '../../services/api'

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    trends: [],
    topItems: [],
    supplierMetrics: []
  })
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('30days')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [inventoryResponse, suppliersResponse, ordersResponse] = await Promise.all([
        api.get('/inventory'),
        api.get('/suppliers'),
        api.get('/purchase-orders')
      ])

      const inventory = Array.isArray(inventoryResponse.data) ? inventoryResponse.data : []
      const suppliers = Array.isArray(suppliersResponse.data) ? suppliersResponse.data : []
      const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : []

      // Overview metrics
      const totalValue = inventory.reduce((sum, item) => sum + (item.current_stock * (item.cost || 100)), 0)
      const totalOrders = orders.length
      const approvedOrders = orders.filter(po => po.status === 'APPROVED').length
      const lowStockItems = inventory.filter(item => item.current_stock <= item.reorder_point).length

      // Top items by value
      const topItems = inventory
        .map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          value: item.current_stock * (item.cost || 100),
          stock: item.current_stock,
          category: item.category_name || 'Uncategorized'
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)

      // Supplier metrics
      const supplierMetrics = suppliers.map(supplier => {
        const supplierOrders = orders.filter(po => po.supplier_id === supplier.id)
        const totalValue = supplierOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0)
        
        return {
          id: supplier.id,
          name: supplier.name,
          orderCount: supplierOrders.length,
          totalValue: totalValue,
          avgOrderValue: supplierOrders.length > 0 ? totalValue / supplierOrders.length : 0
        }
      }).sort((a, b) => b.totalValue - a.totalValue).slice(0, 10)

      setAnalyticsData({
        overview: {
          totalItems: inventory.length,
          totalValue: totalValue,
          totalSuppliers: suppliers.length,
          totalOrders: totalOrders,
          approvedOrders: approvedOrders,
          lowStockItems: lowStockItems
        },
        topItems,
        supplierMetrics
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  const { overview, topItems, supplierMetrics } = analyticsData

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Inventory Value</p>
                  <p className="text-3xl font-bold mt-2">₹{overview.totalValue?.toLocaleString('en-IN') || '0'}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Items</p>
                  <p className="text-3xl font-bold mt-2">{overview.totalItems || 0}</p>
                </div>
                <Package className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Active Suppliers</p>
                  <p className="text-3xl font-bold mt-2">{overview.totalSuppliers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Low Stock Alerts</p>
                  <p className="text-3xl font-bold mt-2">{overview.lowStockItems || 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Items by Value */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Items by Value</h3>
                <p className="text-sm text-gray-600 mt-1">Highest valued inventory items</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.sku} • {item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{item.value.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500">{item.stock} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Suppliers by Order Value */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Suppliers by Order Value</h3>
                <p className="text-sm text-gray-600 mt-1">Highest performing suppliers</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {supplierMetrics.map((supplier, index) => (
                    <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{supplier.name}</p>
                          <p className="text-sm text-gray-500">{supplier.orderCount} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{supplier.totalValue.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500">Avg: ₹{Math.round(supplier.avgOrderValue).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Key Performance Indicators</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <Activity className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-blue-900">{overview.totalOrders || 0}</p>
                  <p className="text-sm text-blue-600 mt-1">Total Purchase Orders</p>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-green-900">{overview.approvedOrders || 0}</p>
                  <p className="text-sm text-green-600 mt-1">Approved Orders</p>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <BarChart3 className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-purple-900">
                    {overview.totalOrders > 0 ? Math.round((overview.approvedOrders / overview.totalOrders) * 100) : 0}%
                  </p>
                  <p className="text-sm text-purple-600 mt-1">Approval Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
