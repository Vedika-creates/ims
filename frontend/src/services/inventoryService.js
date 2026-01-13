import { api } from './api'

export const inventoryService = {
  // Get all inventory items
  getItems: async () => {
    const response = await api.get('/inventory')
    return response.data
  },

  // Get single item by ID
  getItem: async (id) => {
    const response = await api.get(`/inventory/${id}`)
    return response.data
  },

  // Create new inventory item
  createItem: async (itemData) => {
    const response = await api.post('/inventory', itemData)
    return response.data
  },

  // Update inventory item
  updateItem: async (id, itemData) => {
    const response = await api.put(`/inventory/${id}`, itemData)
    return response.data
  },

  // Delete inventory item
  deleteItem: async (id) => {
    const response = await api.delete(`/inventory/${id}`)
    return response.data
  },

  // Get inventory statistics
  getStats: async () => {
    const response = await api.get('/inventory/stats')
    return response.data
  },

  // Get low stock items
  getLowStockItems: async () => {
    const response = await api.get('/inventory/low-stock')
    return response.data
  },

  // Update stock levels
  updateStock: async (id, stockData) => {
    const response = await api.patch(`/inventory/${id}/stock`, stockData)
    return response.data
  }
}
