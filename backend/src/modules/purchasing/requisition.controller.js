// Purchase Requisition Controller
// Auto-generate purchase requisitions based on stock levels
export const generateRequisitionsFromStockLevels = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔍 Auto-generating requisitions from stock levels at:', new Date().toISOString());
    
    // Get a real user ID for requested_by ONCE (not inside loops)
    const userResult = await client.query(
      'SELECT id FROM users WHERE is_active = true LIMIT 1'
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('No active users found in the system');
    }
    
    const requestedBy = userResult.rows[0].id;
    
    // Get items that need replenishment
    const result = await client.query(`
      SELECT 
        i.id,
        i.sku,
        i.name,
        i.reorder_point,
        i.safety_stock,
        i.lead_time_days,
        i.current_stock as current_stock,
        CASE 
          WHEN i.current_stock = 0 THEN 'out_of_stock'
          WHEN i.current_stock <= i.safety_stock THEN 'critical_stock'
          ELSE 'normal'
        END as stock_status,
        -- Calculate suggested reorder quantity
        CASE 
          WHEN i.current_stock = 0 THEN 
            GREATEST(i.reorder_point + i.safety_stock, 1)
          WHEN i.current_stock <= i.safety_stock THEN 
            GREATEST((i.reorder_point + i.safety_stock) - i.current_stock, 1)
          ELSE GREATEST(1, 1)
        END as suggested_quantity
      FROM inventory i
      WHERE i.is_active = true 
        AND i.current_stock IS NOT NULL
        AND (
          i.current_stock = 0 
          OR i.current_stock <= i.safety_stock
        )
      ORDER BY 
        CASE 
          WHEN i.current_stock = 0 THEN 1
          WHEN i.current_stock <= i.safety_stock THEN 2
          ELSE 3
        END,
        i.name
    `);
    
    console.log(`✅ Found ${result.rows.length} items needing replenishment`);
    
    // Debug: Log each item being processed with detailed stock info
    result.rows.forEach(item => {
      console.log(`📦 Item: ${item.name} | Stock: ${item.current_stock} | Safety: ${item.safety_stock} | Reorder: ${item.reorder_point} | Status: ${item.stock_status}`);
    });
    
    // Group items by stock status for separate processing
    const outOfStockItems = result.rows.filter(item => item.stock_status === 'out_of_stock');
    const criticalStockItems = result.rows.filter(item => item.stock_status === 'critical_stock');
    
    const generatedRequisitions = [];
    
    // Process out of stock items (urgent)
    for (const item of outOfStockItems) {
      // Use the already fetched requestedBy (no duplicate query)
      const prNumber = `PR-URGENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const prResult = await client.query(
        `INSERT INTO purchase_requisitions (pr_number, requested_by, status)
         VALUES ($1, $2, 'PENDING')
         RETURNING *`,
        [prNumber, requestedBy]
      );
      
      const pr = prResult.rows[0];
      
      // Add item to requisition with proper quantity validation
      const reorderQuantity = Math.max(1, item.suggested_quantity || 1);
      if (reorderQuantity > 0) {
        await client.query(
          'INSERT INTO purchase_requisition_items (pr_id, item_id, quantity) VALUES ($1, $2, $3)',
          [pr.id, item.id, reorderQuantity]
        );
      }
      
      generatedRequisitions.push({
        id: pr.id,
        pr_number: pr.pr_number,
        status: pr.status,
        item_name: item.name,
        item_sku: item.sku,
        current_stock: item.current_stock,
        min_level: item.reorder_point,
        suggested_quantity: item.suggested_quantity,
        actual_quantity: reorderQuantity,
        stock_status: item.stock_status,
        urgency: 'Critical',
        auto_generated: true
      });
    }
    
    // Process critical stock items (normal priority)
    for (const item of criticalStockItems) {
      // Use the already fetched requestedBy (no duplicate query)
      const prNumber = `PR-CRITICAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const prResult = await client.query(
        `INSERT INTO purchase_requisitions (pr_number, requested_by, status)
         VALUES ($1, $2, 'PENDING')
         RETURNING *`,
        [prNumber, requestedBy]
      );
      
      const pr = prResult.rows[0];
      
      // Add item to requisition with proper quantity validation
      const reorderQuantity = Math.max(1, item.suggested_quantity || 1);
      if (reorderQuantity > 0) {
        await client.query(
          'INSERT INTO purchase_requisition_items (pr_id, item_id, quantity) VALUES ($1, $2, $3)',
          [pr.id, item.id, reorderQuantity]
        );
      }
      
      generatedRequisitions.push({
        id: pr.id,
        pr_number: pr.pr_number,
        status: pr.status,
        item_name: item.name,
        item_sku: item.sku,
        current_stock: item.current_stock,
        min_level: item.reorder_point,
        suggested_quantity: item.suggested_quantity,
        actual_quantity: reorderQuantity,
        stock_status: item.stock_status,
        urgency: 'High',
        auto_generated: true
      });
    }
    
    console.log(`✅ Generated ${generatedRequisitions.length} automatic requisitions`);
    
    await client.query('COMMIT');
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      message: `Generated ${generatedRequisitions.length} purchase requisitions from stock levels`,
      generated_requisitions: generatedRequisitions
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error generating requisitions from stock levels:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Generate auto-PO suggestions (optionally auto-create PRs for critical stock)
export const runAutoPOSuggestions = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');

    const { auto_create_critical: autoCreateCritical = false } = req.body || {};

    const userResult = await client.query(
      'SELECT id FROM users WHERE is_active = true LIMIT 1'
    );

    if (autoCreateCritical && userResult.rows.length === 0) {
      throw new Error('No active users found in the system');
    }

    const requestedBy = userResult.rows[0]?.id;
    const now = new Date();

    const result = await client.query(`
      SELECT 
        i.id,
        i.name,
        i.sku,
        i.reorder_point,
        i.safety_stock,
        i.lead_time_days,
        i.unit_cost,
        i.unit_price,
        s.name as supplier_name,
        COALESCE(cs.current_stock, i.current_stock, 0) as current_stock,
        COALESCE(SUM(ABS(it.quantity)), 0)::int as avg_monthly_demand
      FROM inventory i
      LEFT JOIN vw_current_stock cs ON i.id = cs.item_id
      LEFT JOIN suppliers s ON s.id = i.supplier_id
      LEFT JOIN inventory_transactions it 
        ON it.item_id = i.id
       AND it.created_at >= NOW() - INTERVAL '30 days'
      WHERE i.is_active = true
      GROUP BY i.id, i.name, i.sku, i.reorder_point, i.safety_stock, i.lead_time_days,
               i.unit_cost, i.unit_price, s.name, cs.current_stock, i.current_stock
      ORDER BY i.name
    `);

    const suggestions = [];
    const autoCreatedPRs = [];

    for (const item of result.rows) {
      const currentStock = Number(item.current_stock ?? 0);
      const reorderPoint = Number(item.reorder_point ?? 0);
      const safetyStock = Number(item.safety_stock ?? 0);
      const leadTimeDays = Number(item.lead_time_days ?? 0);

      if (currentStock > reorderPoint && currentStock > safetyStock) {
        continue;
      }

      const isCritical = currentStock <= safetyStock;
      const suggestedQuantity = Math.max((reorderPoint + safetyStock) - currentStock, 1);
      const suggestedDate = new Date(now.getTime() + (leadTimeDays * 24 * 60 * 60 * 1000))
        .toISOString()
        .split('T')[0];

      let prCreated = false;
      let prNumber = null;

      if (autoCreateCritical && isCritical) {
        const pendingResult = await client.query(
          `SELECT pr.id, pr.pr_number
           FROM purchase_requisitions pr
           JOIN purchase_requisition_items pri ON pr.id = pri.pr_id
           WHERE pri.item_id = $1 AND pr.status = 'PENDING'
           LIMIT 1`,
          [item.id]
        );

        if (pendingResult.rows.length === 0) {
          prNumber = `PR-CRIT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}-${Math.floor(Math.random() * 1000)}`;
          const prResult = await client.query(
            `INSERT INTO purchase_requisitions (pr_number, requested_by, status)
             VALUES ($1, $2, 'PENDING')
             RETURNING *`,
            [prNumber, requestedBy]
          );

          await client.query(
            'INSERT INTO purchase_requisition_items (pr_id, item_id, quantity) VALUES ($1, $2, $3)',
            [prResult.rows[0].id, item.id, suggestedQuantity]
          );

          prCreated = true;
          autoCreatedPRs.push({
            pr_id: prResult.rows[0].id,
            pr_number: prNumber,
            item_id: item.id
          });
        }
      }

      suggestions.push({
        id: item.id,
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        supplier: item.supplier_name || 'Unassigned',
        currentStock,
        reorderPoint,
        safetyStock,
        avgMonthlyDemand: Number(item.avg_monthly_demand ?? 0),
        leadTime: leadTimeDays,
        suggestedQuantity,
        suggestedDate,
        priority: isCritical ? 'critical' : 'high',
        status: prCreated ? 'pr_created' : 'pending',
        confidence: isCritical ? 95 : 85,
        calculationMethod: 'static',
        reasoning: isCritical
          ? `Current stock (${currentStock}) is at or below safety stock (${safetyStock}).`
          : `Current stock (${currentStock}) is at or below reorder point (${reorderPoint}).`,
        totalCost: Number(item.unit_cost ?? 0) * suggestedQuantity,
        unitPrice: Number(item.unit_cost ?? 0),
        created: now.toISOString(),
        expires: new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString(),
        prCreated,
        prNumber
      });
    }

    await client.query('COMMIT');

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      suggestions,
      auto_created_prs: autoCreatedPRs
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error generating auto PO suggestions:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Get all purchase requisitions
export const getAllRequisitions = async (req, res) => {
  try {
    const { pool } = await import("../../config/db.js");
    const result = await pool.query(`
      SELECT 
        pr.id,
        pr.pr_number,
        pr.status,
        pr.approved_by,
        pr.approved_at,
        pr.rejection_reason,
        pr.created_at
      FROM purchase_requisitions pr
      ORDER BY pr.created_at DESC
    `);
    
    console.log('✅ Query successful, rows:', result.rows.length);
    
    // Get items for each requisition
    const requisitionsWithItems = await Promise.all(
      result.rows.map(async (pr) => {
        try {
          const itemsResult = await pool.query(`
            SELECT 
              pri.id,
              pri.quantity,
              i.name as item_name,
              i.sku as item_sku,
              i.description as item_description,
              u.name as unit_of_measure
            FROM purchase_requisition_items pri
            LEFT JOIN inventory i ON i.id = pri.item_id
            LEFT JOIN units_of_measure u ON i.unit_of_measure_id = u.id
            WHERE pri.pr_id = $1
          `, [pr.id]);
          
          return {
            ...pr,
            requestedBy: 'Current User', // Simplified for now
            items: itemsResult.rows.map(item => ({
              id: item.id,
              sku: item.item_sku,
              name: item.item_name,
              quantity: item.quantity,
              unitPrice: 0, // Default price - should come from pricing table
              total: item.quantity * 0
            }))
          };
        } catch (error) {
          console.error('❌ Error fetching items for PR:', pr.id, error);
          return {
            ...pr,
            requestedBy: 'Current User',
            items: []
          };
        }
      })
    );
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(requisitionsWithItems);
  } catch (error) {
    console.error('❌ Error in getAllRequisitions at:', new Date().toISOString());
    console.error('❌ Error details:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createRequisition = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    const { requestedBy: requestedByFromRequest, items } = req.body;
    
    console.log('🛒 Creating requisition with data:', { requestedBy: requestedByFromRequest, items });
    
    // Simple validation
    if (!requestedByFromRequest || !items || items.length === 0) {
      return res.status(400).json({ error: 'Requested by and items are required' });
    }
    
    // Get a real user ID for requested_by
    const userResult = await client.query(
      'SELECT id FROM users WHERE is_active = true LIMIT 1'
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('No active users found in the system');
    }
    
    const requestedBy = userResult.rows[0].id;
    
    // Create requisition with a real user
    const prResult = await client.query(
      `INSERT INTO purchase_requisitions (pr_number, requested_by, status)
       VALUES ($1, $2, 'PENDING')
       RETURNING *`,
      [`PR-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`, requestedBy]
    );
    
    const pr = prResult.rows[0];
    
    // Insert requisition items
    for (const item of items) {
      await client.query(
        'INSERT INTO purchase_requisition_items (pr_id, item_id, quantity) VALUES ($1, $2, $3)',
        [pr.id, item.id, item.quantity || 1]
      );
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Requisition created successfully:', pr);
    
    res.status(201).json({
      id: pr.id,
      prNumber: pr.pr_number,
      requestedBy: 'Current User',
      status: pr.status,
      created_at: pr.created_at,
      items: items.map(item => ({
        ...item,
        total: item.quantity * (item.unitPrice || 0)
      })),
      justification: '',
      urgency: 'Normal'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating requisition:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
// Add this function before the exports section
export const deleteRequisition = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // First delete the related items
    await client.query(
      'DELETE FROM purchase_requisition_items WHERE pr_id = $1',
      [id]
    );
    
    // Then delete the requisition
    const result = await client.query(
      'DELETE FROM purchase_requisitions WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Requisition deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting requisition:', error);
    res.status(500).json({ 
      message: 'Error deleting requisition', 
      error: error.message 
    });
  } finally {
    client.release();
  }
};

export const updateRequisition = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status, rejectionReason, rejection_reason, reason } = req.body;
    const reqPath = req.route.path;
    const rejectionNote = rejectionReason || rejection_reason || reason;

    const resolveUserId = async () => {
      if (req.user?.userId) {
        return req.user.userId;
      }

      const userResult = await client.query(
        'SELECT id FROM users WHERE is_active = true LIMIT 1'
      );

      if (userResult.rows.length === 0) {
        throw new Error('No active users found in the system');
      }

      return userResult.rows[0].id;
    };
    
    console.log('🔄 Updating requisition:', id, 'path:', reqPath);
    
    // Determine the status based on the endpoint
    let dbStatus;
    const normalizedStatus = status ? status.toUpperCase() : null;
    if (reqPath.includes('/approve')) {
      dbStatus = 'INWARD_APPROVED';
    } else if (reqPath.includes('/reject')) {
      dbStatus = 'REJECTED';
    } else if (normalizedStatus === 'APPROVED') {
      dbStatus = 'INWARD_APPROVED';
    } else if (normalizedStatus) {
      dbStatus = normalizedStatus;
    } else {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['PENDING', 'INWARD_APPROVED', 'REJECTED'];
    if (!validStatuses.includes(dbStatus)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    let updateQuery, updateParams;
    let updatedRequisition = null;

    if (dbStatus === 'INWARD_APPROVED') {
      const approvedBy = await resolveUserId();

      updateQuery = `
        UPDATE purchase_requisitions 
        SET status = $1, 
            approved_at = NOW(),
            approved_by = $2
        WHERE id = $3 
        RETURNING *
      `;
      updateParams = [dbStatus, approvedBy, id];

      const requisitionResult = await client.query(updateQuery, updateParams);
      updatedRequisition = requisitionResult.rows[0];

      if (!updatedRequisition) {
        return res.status(404).json({ error: "Purchase requisition not found" });
      }

      console.log('🚀 Auto-creating Purchase Order drafts from requisition:', updatedRequisition.pr_number);

      const existingPOs = await client.query(
        'SELECT id, supplier_id FROM purchase_orders WHERE pr_id = $1',
        [id]
      );
      const existingSuppliers = new Set(existingPOs.rows.map(row => row.supplier_id));

      const itemsResult = await client.query(`
        SELECT pri.item_id, pri.quantity, i.supplier_id, s.name as supplier_name
        FROM purchase_requisition_items pri
        LEFT JOIN inventory i ON i.id = pri.item_id
        LEFT JOIN suppliers s ON s.id = i.supplier_id
        WHERE pri.pr_id = $1
      `, [id]);

      if (itemsResult.rows.length > 0) {
        const itemsBySupplier = {};
        const defaultSupplierId = '9e44dbf1-9b5d-4f51-b717-58eeb0a38e1c';
        const defaultSupplierName = 'Furniture Plus';

        itemsResult.rows.forEach(item => {
          const supplierId = item.supplier_id || defaultSupplierId;
          const supplierName = item.supplier_name || defaultSupplierName;

          if (!itemsBySupplier[supplierId]) {
            itemsBySupplier[supplierId] = {
              supplierId,
              supplierName,
              items: []
            };
          }

          itemsBySupplier[supplierId].items.push({
            item_id: item.item_id,
            quantity: item.quantity
          });
        });

        for (const [supplierId, supplierData] of Object.entries(itemsBySupplier)) {
          if (existingSuppliers.has(supplierId)) {
            console.log(`ℹ️ Draft PO already exists for supplier ${supplierData.supplierName}`);
            continue;
          }

          const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}-${Math.floor(Math.random() * 1000)}`;
          const expectedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

          const poResult = await client.query(`
            INSERT INTO purchase_orders (po_number, supplier_id, status, created_by, pr_id, expected_delivery_date)
            VALUES ($1, $2, 'DRAFT', $3, $4, $5)
            RETURNING *
          `, [
            poNumber,
            supplierId,
            approvedBy,
            id,
            expectedDelivery
          ]);

          const newPO = poResult.rows[0];
          console.log(`✅ Purchase Order draft created: ${newPO.po_number} for ${supplierData.supplierName}`);

          for (const item of supplierData.items) {
            await client.query(`
              INSERT INTO purchase_order_items (po_id, item_id, quantity, unit_price)
              VALUES ($1, $2, $3, 100)
            `, [newPO.id, item.item_id, item.quantity]);
          }

          console.log(`✅ Items added to Purchase Order: ${supplierData.items.length} items`);
        }
      }
    } else if (dbStatus === 'REJECTED') {
      if (!rejectionNote) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const approvedBy = await resolveUserId();
      updateQuery = `
        UPDATE purchase_requisitions 
        SET status = $1, 
            approved_at = NOW(),
            approved_by = $2,
            rejection_reason = $3
        WHERE id = $4 
        RETURNING *
      `;
      updateParams = [dbStatus, approvedBy, rejectionNote, id];
    } else {
      updateQuery = `
        UPDATE purchase_requisitions 
        SET status = $1
        WHERE id = $2 
        RETURNING *
      `;
      updateParams = [dbStatus, id];
    }

    if (!updatedRequisition) {
      const result = await client.query(updateQuery, updateParams);
      updatedRequisition = result.rows[0];
    }

    if (!updatedRequisition) {
      return res.status(404).json({ error: "Purchase requisition not found" });
    }

    console.log('✅ Purchase requisition updated successfully:', updatedRequisition);

    await client.query('COMMIT');
    res.json(updatedRequisition);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating requisition:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
