-- Add test user with unique email
INSERT INTO users (name, email, password, role, is_active, created_at, updated_at) VALUES
('Test User', 'testuser@ims.com', 'password123', 'admin', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Alternative: Update existing user
-- UPDATE users SET password = 'password123', name = 'Test User' WHERE email = 'admin@ims.com';

-- Verify user was added
SELECT * FROM users WHERE email = 'testuser@ims.com';
