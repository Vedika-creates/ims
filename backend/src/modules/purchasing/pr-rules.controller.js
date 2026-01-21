// Purchase Requisition Rules Controller
import { v4 as uuidv4 } from 'uuid';

// Get all purchase requisition rules
export const getAllPRRules = async (req, res) => {
  try {
    console.log('🔍 getAllPRRules called at:', new Date().toISOString());
    const { pool } = await import("../../config/db.js");
    
    const result = await pool.query(`
      SELECT 
        r.*,
        u.name as created_by_name
      FROM purchase_requisition_rules r
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.priority, r.created_at DESC
    `);
    
    console.log('✅ Query successful, rows:', result.rows.length);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ Error in getAllPRRules:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get active rules with mappings
export const getActivePRRules = async (req, res) => {
  try {
    console.log('🔍 getActivePRRules called at:', new Date().toISOString());
    const { pool } = await import("../../config/db.js");
    
    const result = await pool.query(`
      SELECT * FROM vw_active_pr_rules
    `);
    
    console.log('✅ Query successful, active rules:', result.rows.length);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ Error in getActivePRRules:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get single rule by ID
export const getPRRuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = await import("../../config/db.js");
    
    const result = await pool.query(`
      SELECT 
        r.*,
        u.name as created_by_name,
        COALESCE(
          json_agg(
            json_build_object(
              'item_id', rim.item_id,
              'item_name', i.name,
              'category_id', rim.category_id,
              'category_name', c.name
            )
          ) FILTER (WHERE rim.id IS NOT NULL),
          '[]'::json
        ) as item_mappings
      FROM purchase_requisition_rules r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN pr_rule_item_mappings rim ON r.id = rim.rule_id
      LEFT JOIN inventory i ON rim.item_id = i.id
      LEFT JOIN categories c ON rim.category_id = c.id
      WHERE r.id = $1
      GROUP BY r.id, u.name
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rule not found" });
    }
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error in getPRRuleById:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create new PR rule
export const createPRRule = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    const { 
      name, 
      description, 
      rule_type, 
      trigger_condition, 
      action_config, 
      priority,
      item_mappings,
      created_by 
    } = req.body;
    
    console.log('🛒 Creating PR rule with data:', { name, rule_type, priority });
    
    // Validation
    if (!name || !rule_type || !trigger_condition || !action_config) {
      return res.status(400).json({ error: 'Name, rule type, trigger condition, and action config are required' });
    }
    
    // Create rule
    // Get a real user ID for created_by
    const userResult = await client.query(
      'SELECT id FROM users WHERE is_active = true LIMIT 1'
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('No active users found in the system');
    }
    
    const createdBy = userResult.rows[0].id;
    
    const ruleResult = await client.query(
      `INSERT INTO purchase_requisition_rules (name, description, rule_type, trigger_condition, action_config, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, rule_type, trigger_condition, action_config, priority || 1, createdBy || createdBy]
    );
    
    const rule = ruleResult.rows[0];
    
    // Insert item mappings if provided
    if (item_mappings && item_mappings.length > 0) {
      for (const mapping of item_mappings) {
        if (mapping.item_id) {
          await client.query(
            'INSERT INTO pr_rule_item_mappings (rule_id, item_id) VALUES ($1, $2)',
            [rule.id, mapping.item_id]
          );
        }
        if (mapping.category_id) {
          await client.query(
            'INSERT INTO pr_rule_item_mappings (rule_id, category_id) VALUES ($1, $2)',
            [rule.id, mapping.category_id]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log('✅ PR rule created successfully:', rule);
    
    res.status(201).json({
      ...rule,
      item_mappings: item_mappings || []
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating PR rule:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Update PR rule
export const updatePRRule = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      name, 
      description, 
      rule_type, 
      trigger_condition, 
      action_config, 
      priority,
      is_active,
      item_mappings
    } = req.body;
    
    console.log('🔄 Updating PR rule:', id);
    
    // Update rule
    const result = await client.query(
      `UPDATE purchase_requisition_rules 
       SET name = $1, description = $2, rule_type = $3, trigger_condition = $4, 
           action_config = $5, priority = $6, is_active = $7, updated_at = NOW()
       WHERE id = $8 
       RETURNING *`,
      [name, description, rule_type, trigger_condition, action_config, priority, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rule not found" });
    }
    
    // Delete existing mappings
    await client.query('DELETE FROM pr_rule_item_mappings WHERE rule_id = $1', [id]);
    
    // Insert new mappings if provided
    if (item_mappings && item_mappings.length > 0) {
      for (const mapping of item_mappings) {
        if (mapping.item_id) {
          await client.query(
            'INSERT INTO pr_rule_item_mappings (rule_id, item_id) VALUES ($1, $2)',
            [id, mapping.item_id]
          );
        }
        if (mapping.category_id) {
          await client.query(
            'INSERT INTO pr_rule_item_mappings (rule_id, category_id) VALUES ($1, $2)',
            [id, mapping.category_id]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log('✅ PR rule updated successfully:', result.rows[0]);
    
    res.json({
      ...result.rows[0],
      item_mappings: item_mappings || []
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating PR rule:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Delete PR rule
export const deletePRRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = await import("../../config/db.js");
    
    const result = await pool.query(
      'DELETE FROM purchase_requisition_rules WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rule not found" });
    }
    
    console.log('✅ PR rule deleted successfully:', result.rows[0]);
    res.json({ message: "Rule deleted successfully" });
    
  } catch (error) {
    console.error('❌ Error deleting PR rule:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Execute rules and generate PRs
export const executePRRules = async (req, res) => {
  try {
    console.log('🚀 Executing PR rules at:', new Date().toISOString());
    const { pool } = await import("../../config/db.js");
    
    // Get active rules
    const rulesResult = await pool.query(`
      SELECT * FROM vw_active_pr_rules
    `);
    
    const generatedPRs = [];
    
    for (const rule of rulesResult.rows) {
      try {
        console.log(`📋 Processing rule: ${rule.name}`);
        
        // Execute rule based on type
        let ruleResult;
        switch (rule.rule_type) {
          case 'STOCK_LEVEL':
            ruleResult = await executeStockLevelRule(rule, pool);
            break;
          case 'TIME_BASED':
            ruleResult = await executeTimeBasedRule(rule, pool);
            break;
          case 'CATEGORY_BASED':
            ruleResult = await executeCategoryBasedRule(rule, pool);
            break;
          default:
            console.log(`⚠️ Unknown rule type: ${rule.rule_type}`);
            continue;
        }
        
        if (ruleResult && ruleResult.length > 0) {
          generatedPRs.push(...ruleResult);
        }
        
        // Log execution
        await pool.query(
          `INSERT INTO pr_rule_executions (rule_id, trigger_data, action_taken, status)
           VALUES ($1, $2, $3, 'SUCCESS')`,
          [rule.id, JSON.stringify({ timestamp: new Date() }), JSON.stringify(ruleResult)]
        );
        
      } catch (error) {
        console.error(`❌ Error executing rule ${rule.name}:`, error);
        
        // Log failed execution
        await pool.query(
          `INSERT INTO pr_rule_executions (rule_id, trigger_data, error_message, status)
           VALUES ($1, $2, $3, 'FAILED')`,
          [rule.id, JSON.stringify({ timestamp: new Date() }), error.message]
        );
      }
    }
    
    console.log(`✅ Generated ${generatedPRs.length} PRs from rules`);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      message: `Generated ${generatedPRs.length} purchase requisitions from rules`,
      generated_prs: generatedPRs
    });
    
  } catch (error) {
    console.error('❌ Error executing PR rules:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Helper function to execute stock level rules
async function executeStockLevelRule(rule, pool) {
  const condition = rule.trigger_condition;
  const threshold = condition.threshold_percentage || 20;
  
  const result = await pool.query(`
    SELECT 
      i.id,
      i.name,
      i.sku,
      i.reorder_point,
      i.safety_stock,
      COALESCE(cs.current_stock, 0) as current_stock,
      CASE 
        WHEN COALESCE(cs.current_stock, 0) = 0 THEN 'out_of_stock'
        WHEN COALESCE(cs.current_stock, 0) <= i.reorder_point THEN 'low_stock'
        ELSE 'normal'
      END as stock_status,
      GREATEST(i.reorder_point + i.safety_stock, 1) as suggested_quantity
    FROM inventory i
    LEFT JOIN vw_current_stock cs ON i.id = cs.item_id
    WHERE i.is_active = true 
      AND (
        COALESCE(cs.current_stock, 0) = 0 
        OR COALESCE(cs.current_stock, 0) <= i.reorder_point
      )
    ORDER BY i.name
  `);
  
  const generatedPRs = [];
  for (const item of result.rows) {
    // Get a real user ID for requested_by
    const userResult = await pool.query(
      'SELECT id FROM users WHERE is_active = true LIMIT 1'
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('No active users found in the system');
    }
    
    const requestedBy = userResult.rows[0].id;
    const prResult = await pool.query(
      `INSERT INTO purchase_requisitions (pr_number, requested_by, status)
       VALUES ($1, $2, 'PENDING')
       RETURNING *`,
      [`PR-RULE-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`, requestedBy]
    );
    
    await pool.query(
      'INSERT INTO purchase_requisition_items (pr_id, item_id, quantity) VALUES ($1, $2, $3)',
      [prResult.rows[0].id, item.id, item.suggested_quantity]
    );
    
    generatedPRs.push({
      id: prResult.rows[0].id,
      pr_number: prResult.rows[0].pr_number,
      item_name: item.name,
      quantity: item.suggested_quantity,
      rule_name: rule.name,
      rule_type: rule.rule_type
    });
  }
  
  return generatedPRs;
}

// Helper function to execute time-based rules
async function executeTimeBasedRule(rule, pool) {
  const condition = rule.trigger_condition;
  const today = new Date();
  const dayOfMonth = today.getDate();
  
  if (condition.schedule_type === 'monthly' && dayOfMonth === condition.day_of_month) {
    console.log(`📅 Monthly rule triggered: ${rule.name}`);
    
    // Get high usage items
    const result = await pool.query(`
      SELECT 
        i.id,
        i.name,
        i.sku,
        SUM(it.quantity) as total_usage
      FROM inventory i
      LEFT JOIN inventory_transactions it ON i.id = it.item_id
      WHERE i.is_active = true
        AND it.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY i.id, i.name, i.sku
      HAVING SUM(it.quantity) >= $1
      ORDER BY total_usage DESC
      LIMIT 10
    `, [condition.min_usage || 10]);
    
    for (const item of result.rows) {
      const reorderQuantity = Math.ceil(item.total_usage * 1.5); // 1.5x usage for safety
      
      // Get a real user ID for requested_by
      const userResult = await pool.query(
        'SELECT id FROM users WHERE is_active = true LIMIT 1'
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('No active users found in the system');
      }
      
      const requestedBy = userResult.rows[0].id;
      const prResult = await pool.query(
        `INSERT INTO purchase_requisitions (pr_number, requested_by, status)
         VALUES ($1, $2, 'PENDING')
         RETURNING *`,
        [`PR-TIME-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`, requestedBy]
      );
      
      await pool.query(
        'INSERT INTO purchase_requisition_items (pr_id, item_id, quantity) VALUES ($1, $2, $3)',
        [prResult.rows[0].id, item.id, reorderQuantity]
      );
      
      generatedPRs.push({
        id: prResult.rows[0].id,
        pr_number: prResult.rows[0].pr_number,
        item_name: item.name,
        quantity: reorderQuantity,
        rule_name: rule.name,
        rule_type: rule.rule_type
      });
    }
    
    return generatedPRs;
  }
  
  return [];
}

// Helper function to execute category-based rules
async function executeCategoryBasedRule(rule, pool) {
  const condition = rule.trigger_condition;
  const categories = condition.categories || [];
  
  if (categories.length === 0) return [];
  
  const result = await pool.query(`
    SELECT 
      i.id,
      i.name,
      i.sku,
      i.reorder_point,
      i.safety_stock,
      COALESCE(cs.current_stock, 0) as current_stock,
      c.name as category_name
    FROM inventory i
    LEFT JOIN vw_current_stock cs ON i.id = cs.item_id
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.is_active = true 
      AND c.name = ANY($1)
      AND COALESCE(cs.current_stock, 0) <= $2
    ORDER BY c.name, i.name
  `, [categories, condition.stock_threshold || 15]);
  
  const generatedPRs = [];
  for (const item of result.rows) {
    const reorderQuantity = Math.max(1, (condition.stock_threshold || 15) - item.current_stock);
    
    // Get a real user ID for requested_by
    const userResult = await pool.query(
      'SELECT id FROM users WHERE is_active = true LIMIT 1'
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('No active users found in the system');
    }
    
    const requestedBy = userResult.rows[0].id;
    const prResult = await pool.query(
      `INSERT INTO purchase_requisitions (pr_number, requested_by, status)
       VALUES ($1, $2, 'PENDING')
       RETURNING *`,
      [`PR-CAT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`, requestedBy]
    );
    
    await pool.query(
      'INSERT INTO purchase_requisition_items (pr_id, item_id, quantity) VALUES ($1, $2, $3)',
      [prResult.rows[0].id, item.id, reorderQuantity]
    );
    
    generatedPRs.push({
      id: prResult.rows[0].id,
      pr_number: prResult.rows[0].pr_number,
      item_name: item.name,
      quantity: reorderQuantity,
      category_name: item.category_name,
      rule_name: rule.name,
      rule_type: rule.rule_type
    });
  }
  
  return generatedPRs;
}
