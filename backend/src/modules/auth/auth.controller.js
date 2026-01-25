import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db.js";

const normalizeRole = (role) => {
  if (!role) return role;

  const normalized = String(role).trim();
  const lower = normalized.toLowerCase();

  if (["admin", "administrator"].includes(lower)) return "Admin";
  if (["inventory manager", "inventory_manager", "inventorymanager"].includes(lower)) {
    return "Inventory Manager";
  }
  if (["warehouse staff", "warehouse_staff", "warehousestaff", "staff"].includes(lower)) {
    return "Warehouse Staff";
  }

  return normalized;
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const normalizedRole = normalizeRole(user.role);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: normalizedRole
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: normalizedRole
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedRole = normalizeRole(role || "Warehouse Staff");

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at",
      [name, email, hashedPassword, normalizedRole]
    );

    const newUser = {
      ...result.rows[0],
      role: normalizedRole
    };

    res.status(201).json({
      message: "User created successfully",
      user: newUser
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};