import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Package, Download, Filter } from 'lucide-react'
import { api } from '../../services/api'

const ABCAnalysis = () => {
  const [abcData, setAbcData] = useState([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({ A: 0, B: 0, C: 0 })

  useEffect(() => {
    loadABCAnalysis()
  }, [])

  const loadABCAnalysis = async () => {
    setLoading(true)
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
          classification: percentage >= 80 ? 'A' : percentage >= 20 ? 'B' : 'C',
          currentStock: item.current_stock,
          unitCost: item.cost || 100
        }
      }).sort((a, b) => b.percentage - a.percentage)

      setAbcData(abcAnalysis)

      const summaryData = abcAnalysis.reduce((acc, item) => {
        acc[item.classification] = (acc[item.classification] || 0) + 1
        return acc
      }, {})

      setSummary({
        A: summaryData.A || 0,
        B: summaryData.B || 0,
        C: summaryData.C || 0
      })
    } catch (error) {
      console.error('Failed to load ABC analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'A': return 'bg-green-100 text-green-800'
      case 'B': return 'bg-yellow-100 text-yellow-800'
      case 'C': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getClassificationBgColor = (classification) => {
    switch (classification) {
      case 'A': return 'bg-green-50 border-green-200'
      case 'B': return 'bg-yellow-50 border-yellow-200'
      case 'C': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const exportToCSV = () => {
    const headers = ['Item Name', 'SKU', 'Category', 'Current Stock', 'Unit Cost', 'Current Value', 'Percentage', 'Classification']
    const csvContent = [
      headers.join(','),
      ...abcData.map(item => [
        item.name,
        item.sku,
        item.category,
        item.currentStock,
        item.unitCost,
        item.currentValue,
        item.percentage.toFixed(2) + '%',
        item.classification
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'abc-analysis-report.csv'
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
            <h1 className="text-2xl font-bold text-gray-900">ABC Analysis Report</h1>
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
            <div className={`border-2 rounded-lg p-6 ${getClassificationBgColor('A')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Class A Items</p>
                  <p className="text-3xl font-bold text-green-900">{summary.A}</p>
                  <p className="text-xs text-green-600 mt-1">High value (≥80%)</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className={`border-2 rounded-lg p-6 ${getClassificationBgColor('B')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Class B Items</p>
                  <p className="text-3xl font-bold text-yellow-900">{summary.B}</p>
                  <p className="text-xs text-yellow-600 mt-1">Medium value (20-80%)</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className={`border-2 rounded-lg p-6 ${getClassificationBgColor('C')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Class C Items</p>
                  <p className="text-3xl font-bold text-red-900">{summary.C}</p>
                  <p className="text-xs text-red-600 mt-1">Low value (&lt;20%)</p>
                </div>
                <Package className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Detailed ABC Classification</h3>
              <p className="text-sm text-gray-600 mt-1">Items sorted by value contribution percentage</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classification</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {abcData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.currentStock}</td>
                      <td className="px-6 py-4 whitespace-nowrap">₹{item.unitCost.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">₹{item.currentValue.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium">{item.percentage.toFixed(1)}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassificationColor(item.classification)}`}>
                          Class {item.classification}
                        </span>
                      </td>
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

export default ABCAnalysis
