-- Add test user for authentication testing
INSERT INTO users (name, email, password, role, is_active, created_at, updated_at) VALUES
('Test User', 'test@example.com', 'password123', 'admin', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Verify user was added
SELECT * FROM users WHERE email = 'test@example.com';
