import dotenv from "dotenv";
dotenv.config(); // ✅ LOAD ENV FIRST

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

export { pool };
