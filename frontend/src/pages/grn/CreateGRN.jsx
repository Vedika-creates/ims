import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Package, ArrowLeft, Save, Search, Plus, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { api } from '../../services/api'
import PurchaseOrdersSimple from '../purchasing/PurchaseOrdersSimple'

const CreateGRN = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const poNumber = searchParams.get('po')
  
  // Get PO data from navigation state or URL params
  const purchaseOrder = location.state?.purchaseOrder
  
  const [selectedPO, setSelectedPO] = useState(purchaseOrder || null)
  const [searchTerm, setSearchTerm] = useState(poNumber || '')
  const [showPOSearch, setShowPOSearch] = useState(!poNumber && !purchaseOrder)
  const [grnData, setGrnData] = useState({
    grnNumber: `GRN-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    poNumber: poNumber || '',
    supplier: '',
    receivedDate: new Date().toISOString().split('T')[0],
    receivedBy: 'Current User',
    items: [],
    notes: '',
    status: 'In Progress'
  })

  // Auto-populate form when PO data is available
  useEffect(() => {
    if (purchaseOrder) {
      setGrnData(prev => ({
        ...prev,
        poNumber: purchaseOrder.po_number,
        supplier: purchaseOrder.supplier_name,
        items: purchaseOrder.items?.map(item => ({
          ...item,
          receivedQuantity: 0,
          acceptedQuantity: 0,
          rejectedQuantity: 0,
          batchNumber: '',
          expiryDate: '',
          serialNumbers: []
        })) || []
      }))
      setSelectedPO(purchaseOrder)
      setShowPOSearch(false)
    }
  }, [purchaseOrder])

  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch real purchase orders from API
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        console.log('🔍 Fetching purchase orders and requisitions...')
        
        // Fetch both purchase orders and purchase requisitions
        const [poResponse, reqResponse] = await Promise.all([
          api.get('/purchase-orders'),
          api.get('/purchase-requisitions')
        ])
        
        console.log('📊 PO Response:', poResponse.data)
        console.log('📊 Requisition Response:', reqResponse.data)

        const poData = Array.isArray(poResponse.data) ? poResponse.data : []
        const reqData = Array.isArray(reqResponse.data) ? reqResponse.data : []
        
        // Filter approved purchase orders
        const approvedPOs = poData.filter(po => po.status === 'APPROVED')
        console.log('✅ Approved POs:', approvedPOs)
        
        // Filter approved purchase requisitions (INWARD_APPROVED or approved)
        const approvedReqs = reqData.filter(req => 
          req.status === 'INWARD_APPROVED' || req.status === 'approved'
        )
        console.log('✅ Approved Requisitions:', approvedReqs)
        
        // Convert approved requisitions to PO format
        const convertedPOs = approvedReqs.map(req => ({
          id: `req-${req.id}`,
          po_number: `PO-${req.pr_number || 'AUTO'}`,
          supplier_name: 'Auto-generated from PR',
          total_quantity: req.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
          total_amount: req.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0,
          status: 'APPROVED',
          items: req.items?.map(item => ({
            item_id: item.id,
            item_sku: item.sku,
            item_name: item.name,
            quantity: item.quantity,
            unit_price: item.unitPrice || 0
          })) || [],
          isFromRequisition: true
        }))
        
        console.log('🔄 Converted requisitions to PO format:', convertedPOs)
        
        // Combine both lists
        const allApprovedPOs = [...approvedPOs, ...convertedPOs]
        console.log('🎯 All approved POs (including requisitions):', allApprovedPOs)
        
        // Fetch items for each actual PO (not needed for converted requisitions)
        const posWithItems = await Promise.all(
          allApprovedPOs.map(async (po) => {
            if (po.isFromRequisition) {
              // Requisitions already have items
              return po
            } else {
              try {
                console.log(`🔍 Fetching items for PO ${po.po_number} (ID: ${po.id})`)
                const itemsResponse = await api.get(`/purchase-orders/${po.id}/items`)
                console.log(`📦 Items for PO ${po.po_number}:`, itemsResponse.data)
                return { ...po, items: itemsResponse.data }
              } catch (error) {
                console.warn(`Failed to fetch items for PO ${po.po_number}:`, error)
                return { ...po, items: [] }
              }
            }
          })
        )
        
        console.log('🎯 Final POs with items:', posWithItems)
        setPurchaseOrders(posWithItems)
      } catch (error) {
        console.error('Failed to fetch purchase orders and requisitions:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPurchaseOrders()
  }, [])

  useEffect(() => {
    if (poNumber && purchaseOrders.length > 0) {
      const po = purchaseOrders.find(p => p.po_number === poNumber)
      if (po) {
        handlePOSelect(po)
      }
    }
  }, [poNumber, purchaseOrders])

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesPO = po.po_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSupplier = po.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
    console.log(`🔍 Search: "${searchTerm}" vs PO: "${po.po_number}" (${matchesPO}) / Supplier: "${po.supplier_name}" (${matchesSupplier})`)
    return matchesPO || matchesSupplier
  })

  const handlePOSelect = (po) => {
    setSelectedPO(po)
    setGrnData(prev => ({
      ...prev,
      poNumber: po.po_number,
      supplier: po.supplier_name,
      items: po.items?.map(item => ({
        id: item.item_id || item.id,
        sku: item.item_sku || item.sku,
        name: item.item_name || item.name,
        quantity: item.quantity,
        unitPrice: item.unit_price || item.unitPrice || 100,
        receivedQuantity: 0,
        acceptedQuantity: 0,
        rejectedQuantity: 0,
        batchNumber: '',
        expiryDate: '',
        serialNumbers: [],
        notes: '',
        // Add flag to indicate if this is from requisition
        isFromRequisition: po.isFromRequisition || false,
        originalRequisitionId: po.isFromRequisition ? po.id.replace('req-', '') : null
      })) || []
    }))
    setShowPOSearch(false)
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...grnData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'receivedQuantity' || field === 'acceptedQuantity' || field === 'rejectedQuantity' 
        ? parseInt(value) || 0 
        : value || ''
    }
    
    // Auto-calculate accepted quantity
    if (field === 'receivedQuantity') {
      updatedItems[index].acceptedQuantity = parseInt(value) || 0
      updatedItems[index].rejectedQuantity = 0
    } else if (field === 'rejectedQuantity') {
      const received = updatedItems[index].receivedQuantity || 0
      const rejected = parseInt(value) || 0
      updatedItems[index].acceptedQuantity = Math.max(0, received - rejected)
    }
    
    setGrnData(prev => ({ ...prev, items: updatedItems }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setGrnData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate that at least one item has been received
    const hasReceivedItems = grnData.items.some(item => item.acceptedQuantity > 0)
    if (!hasReceivedItems) {
      alert('Please enter received quantities for at least one item')
      return
    }
    
    // Check if this is from a requisition
    const isFromRequisition = grnData.items.some(item => item.isFromRequisition)
    
    try {
      let actualPoNumber = grnData.poNumber
      
      if (isFromRequisition) {
        // For requisitions, create a temporary PO record first
        const requisitionId = grnData.items.find(item => item.originalRequisitionId)?.originalRequisitionId
        
        console.log('🔄 Creating temporary PO for requisition:', requisitionId)
        
        // First, get a list of available suppliers to use a default one
        const suppliersResponse = await api.get('/suppliers')
        const availableSuppliers = Array.isArray(suppliersResponse.data) ? suppliersResponse.data : []
        
        if (availableSuppliers.length === 0) {
          throw new Error('No suppliers available in the system. Please create a supplier first.')
        }
        
        // Use the first available supplier as default for requisitions
        const defaultSupplier = availableSuppliers[0]
        console.log('📦 Using default supplier:', defaultSupplier.name)
        
        console.log('🎯 GRN items for PO creation:', grnData.items)
        
        const poData = {
          po_number: grnData.poNumber,
          supplier_id: defaultSupplier.id, // Use supplier_id instead of supplier_name
          supplier_name: defaultSupplier.name, // Also send name for reference
          items: grnData.items.map(item => ({
            // Send SKU for requisition items, let backend handle UUID resolution
            id: item.isFromRequisition ? item.sku : item.id,
            quantity: item.quantity,
            unit_price: item.unitPrice || 100
          })),
          total_amount: grnData.items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 100)), 0),
          pr_id: requisitionId
        }
        
        const poResponse = await api.post('/purchase-orders', poData)
        console.log('✅ Temporary PO created:', poResponse.data)
        actualPoNumber = poResponse.data.po_number
      }
      
      // Prepare GRN data for backend
      const backendData = {
        grn_number: grnData.grnNumber,
        po_number: actualPoNumber,
        supplier: grnData.supplier,
        received_date: grnData.receivedDate,
        received_by: grnData.receivedBy,
        items: grnData.items.map(item => ({
          // Send SKU for requisition items, let backend handle UUID resolution
          item_id: item.isFromRequisition ? item.sku : item.id,
          po_item_id: null, // Will be filled by backend
          accepted_qty: item.acceptedQuantity || 0,
          rejected_qty: item.rejectedQuantity || 0,
          batch_no: item.batchNumber || '',
          expiry_date: item.expiryDate || null,
          serial_numbers: item.serialNumbers || []
        })),
        total_value: grnData.items.reduce((sum, item) => sum + ((item.acceptedQuantity || 0) * (item.unitPrice || 100)), 0),
        notes: grnData.notes || ''
      }
      
      console.log('📦 Creating GRN with data:', backendData)
      
      const response = await api.post('/grn', backendData)
      
      if (response.status === 201) {
        alert('GRN created successfully!')
        navigate('/grn')
      }
    } catch (error) {
      console.error('Failed to create GRN:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create GRN'
      alert(`Failed to create GRN: ${errorMessage}`)
    }
  }

  const addSerialNumber = (itemIndex) => {
    const serialNumber = prompt('Enter serial number:')
    if (serialNumber) {
      const updatedItems = [...grnData.items]
      if (!updatedItems[itemIndex].serialNumbers) {
        updatedItems[itemIndex].serialNumbers = []
      }
      updatedItems[itemIndex].serialNumbers.push(serialNumber)
      setGrnData(prev => ({ ...prev, items: updatedItems }))
    }
  }

  const removeSerialNumber = (itemIndex, serialIndex) => {
    const updatedItems = [...grnData.items]
    updatedItems[itemIndex].serialNumbers.splice(serialIndex, 1)
    setGrnData(prev => ({ ...prev, items: updatedItems }))
  }

  if (showPOSearch) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/grn')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to GRNs</span>
          </button>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Package className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Goods Receipt Note</h1>
                <p className="text-sm text-gray-500">Select a purchase order to create GRN</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Purchase Order</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter PO number or supplier name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-field w-full"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading purchase orders...</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPOs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No approved purchase orders found</div>
                  </div>
                ) : (
                  filteredPOs.map((po) => (
                    <div
                      key={po.id}
                      onClick={() => handlePOSelect(po)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">{po.po_number}</h3>
                            {po.isFromRequisition && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                From Requisition
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">Supplier: {po.supplier_name}</p>
                          <p className="text-sm text-gray-500">Total: {po.total_quantity || po.items?.length || 0} items, ${po.total_amount}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {po.status}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">{po.items?.length || 0} items</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/grn')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GRNs</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-gray-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Goods Receipt Note</h1>
              <p className="text-sm text-gray-500">Record incoming inventory from purchase order</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">GRN Number</label>
              <input
                type="text"
                name="grnNumber"
                value={grnData.grnNumber}
                onChange={handleInputChange}
                className="mt-1 input-field"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">PO Number</label>
              <input
                type="text"
                name="poNumber"
                value={grnData.poNumber}
                onChange={handleInputChange}
                className="mt-1 input-field"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier</label>
              <input
                type="text"
                value={grnData.supplier}
                className="mt-1 input-field"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Received Date</label>
              <input
                type="date"
                name="receivedDate"
                value={grnData.receivedDate}
                onChange={handleInputChange}
                className="mt-1 input-field"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Items to Receive</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accepted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serials</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grnData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.sku}</div>
                          <div className="text-xs text-gray-400">${item.unitPrice} each</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={item.receivedQuantity}
                          onChange={(e) => handleItemChange(index, 'receivedQuantity', e.target.value)}
                          className="w-20 input-field text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          value={item.acceptedQuantity}
                          readOnly
                          className="w-20 input-field text-sm bg-gray-50"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          max={item.receivedQuantity}
                          value={item.rejectedQuantity}
                          onChange={(e) => handleItemChange(index, 'rejectedQuantity', e.target.value)}
                          className="w-20 input-field text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)}
                          placeholder="Batch #"
                          className="w-24 input-field text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                          className="w-32 input-field text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => addSerialNumber(index)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <span className="text-xs text-gray-500">
                              {item.serialNumbers?.length || 0} serials
                            </span>
                          </div>
                          {item.serialNumbers?.map((serial, serialIndex) => (
                            <div key={serialIndex} className="flex items-center space-x-1">
                              <span className="text-xs text-gray-600">{serial}</span>
                              <button
                                type="button"
                                onClick={() => removeSerialNumber(index, serialIndex)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              name="notes"
              value={grnData.notes}
              onChange={handleInputChange}
              rows={3}
              className="input-field w-full"
              placeholder="Any notes about the receipt, damages, or discrepancies..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/grn')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Complete GRN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGRN
