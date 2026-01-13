-- Test database connection
-- Check if database exists
SELECT datname FROM pg_database WHERE datname = 'ims';

-- Test simple query
SELECT 1 as test_connection;

-- Check if users table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';
