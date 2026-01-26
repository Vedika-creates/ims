import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, DollarSign, Users, ShoppingCart, Download } from 'lucide-react'
import { api } from '../../services/api'
import { Bar, Pie, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const Reports = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [reports, setReports] = useState({ overview: {} })
  const [loading, setLoading] = useState(false)

  const userRole = localStorage.getItem('userRole') || ''
  const canViewPurchaseOrders = ['Inventory Manager', 'Admin'].includes(userRole)

  useEffect(() => {
    loadReports()
  }, [activeTab])

  // Also load on first mount to fix the "need to refresh" issue
  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverview()
    }
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      if (activeTab === 'overview') await loadOverview()
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOverview = async () => {
    try {
      const requests = [api.get('/inventory'), api.get('/suppliers'), api.get('/purchase-orders')]
      const responses = await Promise.allSettled(requests)
      const [inventoryResponse, suppliersResponse, ordersResponse] = responses
      const inventory = inventoryResponse.status === 'fulfilled' && Array.isArray(inventoryResponse.value.data) ? inventoryResponse.value.data : []
      const suppliers = suppliersResponse.status === 'fulfilled' && Array.isArray(suppliersResponse.value.data) ? suppliersResponse.value.data : []
      const orders = ordersResponse && ordersResponse.status === 'fulfilled' && Array.isArray(ordersResponse.value.data) ? ordersResponse.value.data : []

      const totalValue = inventory.reduce((sum, item) => sum + (item.current_stock * (item.cost || 100)), 0)
      const totalOrders = orders.length
      const approvedOrders = orders.filter(po => po.status === 'APPROVED').length
      const pendingOrders = orders.filter(po => po.status === 'DRAFT').length
      const outOfStockItems = inventory.filter(item => {
        const stock = item.current_stock
        return stock === 0 || stock === "0" || stock === null || stock === undefined || stock === ""
      }).length

      // Log order access for debugging
      if (ordersResponse.status === 'rejected') {
        console.log('📊 Orders not accessible for this role (expected for Warehouse Staff)')
      } else {
        console.log(`📊 Loaded ${orders.length} orders for dashboard`)
      }

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
          outOfStockItems: outOfStockItems
        }
      }))
    } catch (error) {
      console.error('Failed to load overview:', error)
    }
  }

  const exportToCSV = (data, filename) => {
    if (!Array.isArray(data) || data.length === 0) return
    const headers = Object.keys(data[0]).join(',')
    const csvContent = [headers, ...data.map(row => Object.values(row).join(','))].join('\n')
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
    const totalItems = Number(overview.totalItems) || 0
    const lowStockItems = Number(overview.lowStockItems) || 0
    const outOfStockItems = Number(overview.outOfStockItems) || 0
    const approvedOrders = Number(overview.approvedOrders) || 0
    const pendingOrders = Number(overview.pendingOrders) || 0

    const inventoryStatusData = {
      labels: ['Normal Stock', 'Low Stock', 'Out of Stock'],
      datasets: [{
        label: 'Items',
        data: [
          Math.max(0, totalItems - lowStockItems - outOfStockItems),
          lowStockItems,
          outOfStockItems
        ],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(251, 146, 60)', 'rgb(239, 68, 68)'],
        borderWidth: 1
      }]
    }

    const orderStatusData = {
      labels: ['Approved Orders', 'Pending Orders'],
      datasets: [{
        label: 'Orders',
        data: [approvedOrders, pendingOrders],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(251, 191, 36)'],
        borderWidth: 1
      }]
    }

    const kpiData = {
      labels: ['Total Value', 'Total Items', 'Suppliers', 'Orders'],
      datasets: [{
        label: 'KPIs',
        data: [
          (overview.totalValue || 0) / 1000,
          totalItems * 10,
          (overview.totalSuppliers || 0) * 100,
          (overview.totalOrders || 0) * 50
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }]
    }

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Status</h3>
            <div className="h-64">
              <Doughnut data={inventoryStatusData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Current Inventory Distribution' } } }} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status</h3>
            <div className="h-64">
              {approvedOrders === 0 && pendingOrders === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-sm">Order data not available for your role</p>
                    <p className="text-xs mt-1">Contact Admin for purchase order access</p>
                  </div>
                </div>
              ) : (
                <Pie data={orderStatusData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Purchase Order Distribution' } } }} />
              )}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Performance Indicators</h3>
            <div className="h-64">
              <Bar data={kpiData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: 'Business Metrics Overview' } }, scales: { y: { beginAtZero: true } } }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="mt-2 text-gray-600">View inventory and business analytics</p>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            {activeTab === 'overview' && renderOverview()}
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
