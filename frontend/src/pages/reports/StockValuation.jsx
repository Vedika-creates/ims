import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Package, Download, Filter } from 'lucide-react'
import { api } from '../../services/api'

const StockValuation = () => {
  const [stockData, setStockData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    category: 'all',
    warehouse: 'all',
    valuationMethod: 'fifo'
  })

  useEffect(() => {
    loadStockValuation()
  }, [filters])

  const loadStockValuation = async () => {
    setLoading(true)
    try {
      const response = await api.get('/inventory')
      const inventory = response.data

      const valuation = inventory.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category_name || 'Uncategorized',
        currentStock: item.current_stock,
        unitCost: item.cost || 100,
        totalValue: item.current_stock * (item.cost || 100),
        warehouse: item.warehouse_name || 'Main Warehouse'
      }))

      setStockData(valuation)
    } catch (error) {
      console.error('Failed to load stock valuation:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalValue = stockData.reduce((sum, item) => sum + item.totalValue, 0)
  const totalItems = stockData.length

  const exportToCSV = () => {
    const headers = ['Item Name', 'SKU', 'Category', 'Current Stock', 'Unit Cost', 'Total Value', 'Warehouse']
    const csvContent = [
      headers.join(','),
      ...stockData.map(item => [
        item.name,
        item.sku,
        item.category,
        item.currentStock,
        item.unitCost,
        item.totalValue,
        item.warehouse
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'stock-valuation-report.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Stock Valuation Report</h1>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Value</p>
                  <p className="text-2xl font-bold text-blue-900">₹{totalValue.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Total Items</p>
                  <p className="text-2xl font-bold text-green-900">{totalItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Avg Value/Item</p>
                  <p className="text-2xl font-bold text-purple-900">₹{totalItems > 0 ? Math.round(totalValue / totalItems).toLocaleString('en-IN') : '0'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.currentStock}</td>
                      <td className="px-6 py-4 whitespace-nowrap">₹{item.unitCost.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">₹{item.totalValue.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.warehouse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockValuation
