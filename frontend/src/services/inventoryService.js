import { api } from './api'

export const inventoryService = {
  // Get all inventory items
  getItems: async () => {
    const response = await api.get('/inventory')
    return response.data?.filter(item => item.is_active === true) || []
  },

  // Get inventory summary for dashboard
  getSummary: async () => {
    const response = await api.get('/inventory/summary')
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

  // Adjust stock levels
  adjustStock: async (stockData) => {
    const response = await api.post('/inventory/adjust', stockData)
    return response.data
  }
}
