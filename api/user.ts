import express from "express";
import { conn } from "../dbconnect";
import mysql from "mysql";

export const router = express.Router();

// POST /api/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  let sql = "SELECT * FROM User WHERE email = ? AND password = ?";
  sql = mysql.format(sql, [email, password]);

  conn.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: "Database error", detail: err });
    } else if (result.length === 0) {
      res.status(401).json({ message: "Invalid email or password" });
    } else {
      const user = result[0];

      // อัปเดต status เป็น true
      let updateSql = "UPDATE User SET status = true WHERE uid = ?";
      updateSql = mysql.format(updateSql, [user.uid]);

      conn.query(updateSql, (updateErr) => {
        if (updateErr) {
          res.status(500).json({ error: "Failed to update status", detail: updateErr });
        } else {
          res.status(200).json({
            message: "Login successful",
            user: {
              uid: user.uid,
              name: user.name,
              email: user.email,
              status: true,
            },
          });
        }
      });
    }
  });
});


// POST /api/register
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  // ตรวจสอบว่ามีอีเมลนี้ในระบบหรือยัง
  let checkSql = "SELECT * FROM User WHERE email = ?";
  checkSql = mysql.format(checkSql, [email]);

  conn.query(checkSql, (err, result) => {
    if (err) {
      res.status(500).json({ error: "Database error", detail: err });
    } else if (result.length > 0) {
      res.status(409).json({ message: "Email already registered" });
    } else {
      // ถ้ายังไม่มี ให้สมัคร
      let insertSql = "INSERT INTO User (name, email, password, status) VALUES (?, ?, ?, ?)";
      insertSql = mysql.format(insertSql, [name, email, password, false]);

      conn.query(insertSql, (err, result) => {
        if (err) {
          res.status(500).json({ error: "Insert failed", detail: err });
        } else {
          res.status(201).json({
            message: "Registration successful",
            userId: result.insertId,
          });
        }
      });
    }
  });
});

// POST /api/change-password
router.post("/change-password", (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  // ตรวจสอบว่ารหัสผ่านเก่าถูกต้อง
  let checkSql = "SELECT * FROM User WHERE email = ? AND password = ?";
  checkSql = mysql.format(checkSql, [email, oldPassword]);

  conn.query(checkSql, (err, result) => {
    if (err) {
      res.status(500).json({ error: "Database error", detail: err });
    } else if (result.length === 0) {
      res.status(401).json({ message: "Old password is incorrect" });
    } else {
      // รหัสผ่านถูกต้อง → เปลี่ยนรหัสใหม่
      let updateSql = "UPDATE User SET password = ? WHERE email = ?";
      updateSql = mysql.format(updateSql, [newPassword, email]);

      conn.query(updateSql, (err, updateResult) => {
        if (err) {
          res.status(500).json({ error: "Failed to update password", detail: err });
        } else {
          res.status(200).json({ message: "Password changed successfully" });
        }
      });
    }
  });
});

// POST /api/reset-password
router.post("/reset-password", (req, res) => {
  const { email, newPassword } = req.body;

  const updateSql = "UPDATE User SET password = ? WHERE email = ?";
  const formattedSql = mysql.format(updateSql, [newPassword, email]);

  conn.query(formattedSql, (err, result) => {
    if (err) {
      res.status(500).json({ error: "Failed to update password", detail: err });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: "User not found" });
    } else {
      res.status(200).json({ message: "Password changed successfully" });
    }
  });
});