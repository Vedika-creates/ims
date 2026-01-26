import dotenv from "dotenv";
dotenv.config(); // ✅ LOAD ENV FIRST

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: 
    process.env.NODE_ENV === "production" ? { rejectUnauthorized: false }: false,
  


});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

export { pool };
