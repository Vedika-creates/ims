const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ims',
  user: 'postgres',
  password: 'vedika',
});

pool.query('SELECT NOW()')
  .then(res => {
    console.log('✅ Database connection successful:', res.rows[0]);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
