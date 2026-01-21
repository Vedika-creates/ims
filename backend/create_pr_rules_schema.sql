-- Purchase Requisition Rules Schema
-- This schema allows users to define custom rules for automatic PR and PO generation

-- Table for storing purchase requisition rules
CREATE TABLE IF NOT EXISTS purchase_requisition_rules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    rule_type text NOT NULL CHECK (rule_type IN ('STOCK_LEVEL', 'TIME_BASED', 'QUANTITY_BASED', 'CATEGORY_BASED')),
    trigger_condition jsonb NOT NULL, -- Flexible JSON for different trigger conditions
    action_config jsonb NOT NULL, -- Flexible JSON for action configuration
    priority integer DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES users(id),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Table for storing rule execution history
CREATE TABLE IF NOT EXISTS pr_rule_executions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    rule_id uuid NOT NULL REFERENCES purchase_requisition_rules(id) ON DELETE CASCADE,
    execution_time timestamp without time zone DEFAULT now(),
    trigger_data jsonb, -- What triggered the rule
    action_taken jsonb, -- What action was taken
    status text DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL')),
    error_message text,
    created_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Table for linking rules to specific items or categories
CREATE TABLE IF NOT EXISTS pr_rule_item_mappings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    rule_id uuid NOT NULL REFERENCES purchase_requisition_rules(id) ON DELETE CASCADE,
    item_id uuid REFERENCES items(id) ON DELETE CASCADE,
    category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
    created_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (rule_id, item_id),
    UNIQUE (rule_id, category_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pr_rules_type ON purchase_requisition_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_pr_rules_active ON purchase_requisition_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pr_rules_priority ON purchase_requisition_rules(priority);
CREATE INDEX IF NOT EXISTS idx_pr_rule_executions_rule ON pr_rule_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_pr_rule_executions_time ON pr_rule_executions(execution_time);

-- Insert sample rules for demonstration
INSERT INTO purchase_requisition_rules (name, description, rule_type, trigger_condition, action_config, priority, created_by) VALUES
(
    'Critical Stock Reorder',
    'Automatically generate PR when stock falls below critical level',
    'STOCK_LEVEL',
    '{"condition_type": "stock_below_critical", "threshold_percentage": 20, "include_zero_stock": true}',
    '{"auto_approve": false, "urgency": "Critical", "notification_emails": ["manager@company.com"]}',
    1,
    '16b98519-3557-41c1-8619-164c03f612da'
),
(
    'Monthly Bulk Order',
    'Generate bulk purchase orders for high-usage items monthly',
    'TIME_BASED',
    '{"schedule_type": "monthly", "day_of_month": 1, "usage_threshold": 50}',
    '{"auto_approve": true, "urgency": "Normal", "bulk_discount": true}',
    3,
    '16b98519-3557-41c1-8619-164c03f612da'
),
(
    'Category-Based Reorder',
    'Reorder items in specific categories when stock is low',
    'CATEGORY_BASED',
    '{"categories": ["Electronics", "Office Supplies"], "stock_threshold": 15}',
    '{"auto_approve": false, "urgency": "Normal", "group_by_category": true}',
    2,
    '16b98519-3557-41c1-8619-164c03f612da'
);

-- Create a view for active rules with their mappings
CREATE OR REPLACE VIEW vw_active_pr_rules AS
SELECT 
    r.*,
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
LEFT JOIN pr_rule_item_mappings rim ON r.id = rim.rule_id
LEFT JOIN items i ON rim.item_id = i.id
LEFT JOIN categories c ON rim.category_id = c.id
WHERE r.is_active = true
GROUP BY r.id
ORDER BY r.priority, r.created_at;
