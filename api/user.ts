import express from "express";
import { conn } from "../dbconnect";
import sqlite3 from "sqlite3";

export const router = express.Router();

// เปิดการเชื่อมต่อฐานข้อมูล SQLite
const db = new sqlite3.Database("./codingforlearning.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the SQLite database.");
});

// สร้าง API สำหรับการ login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM Users WHERE email = ? AND password = ?";

  db.get(sql, [email, password], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      return res.json({ message: "Login Successful", user: row });
    } else {
      return res.status(400).json({ message: "Invalid email or password" });
    }
  });
});

// สร้าง API สำหรับการ register
router.post("/register", (req, res) => {
  const { name, email, password, image } = req.body;

  // ตรวจสอบว่าผู้ใช้งานนี้มีอยู่ในระบบแล้วหรือไม่
  const checkUserSql = "SELECT * FROM Users WHERE email = ?";
  db.get(checkUserSql, [email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      return res.status(400).json({ message: "User already exists" });
    } else {
      // เพิ่มผู้ใช้ใหม่ในฐานข้อมูล
      const insertUserSql =
        "INSERT INTO Users (name, email, password, image) VALUES (?, ?, ?, ?)";
      db.run(insertUserSql, [name, email, password, image], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        return res.json({
          message: "User registered successfully",
          userId: this.lastID,
        });
      });
    }
  });
});

// สร้าง API สำหรับการดึงข้อมูลผู้ใช้ทั้งหมด
router.get("/users", (req, res) => {
  const sql = "SELECT * FROM Users";

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ users: rows });
  });
});
