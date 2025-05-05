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

// POST /api/edit
router.post("/edit", (req, res) => {
  const { uid, name, email, password, confirmPassword } = req.body;

  // ดึงข้อมูลเดิมจากฐานข้อมูล
  let getUserSql = "SELECT * FROM User WHERE uid = ?";
  getUserSql = mysql.format(getUserSql, [uid]);

  conn.query(getUserSql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error", detail: err });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];

    // ใช้ค่าจาก body ถ้ามี หรือใช้ค่าจากฐานข้อมูล
    const updatedName = name || user.name;
    const updatedEmail = email || user.email;
    const updatedPassword = password || user.password;

    // ถ้ามีการเปลี่ยน password ต้องมี confirmPassword และต้องตรงกัน
    if (password && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // ตรวจสอบว่าอีเมลใหม่ซ้ำกับของผู้ใช้อื่นไหม (ยกเว้นตัวเอง)
    let checkEmailSql = "SELECT * FROM User WHERE email = ? AND uid != ?";
    checkEmailSql = mysql.format(checkEmailSql, [updatedEmail, user.uid]);

    conn.query(checkEmailSql, (err, emailResult) => {
      if (err) {
        return res.status(500).json({ error: "Database error", detail: err });
      }
      if (emailResult.length > 0) {
        return res.status(409).json({ message: "Email already in use by another account" });
      }

      // อัปเดตข้อมูลผู้ใช้
      let updateSql = "UPDATE User SET name = ?, email = ?, password = ? WHERE uid = ?";
      updateSql = mysql.format(updateSql, [updatedName, updatedEmail, updatedPassword, uid]);

      conn.query(updateSql, (err, updateResult) => {
        if (err) {
          return res.status(500).json({ error: "Update failed", detail: err });
        }
        res.status(200).json({ message: "User updated successfully" });
      });
    });
  });
});

// GET /user/:uid
router.get("/:uid", (req, res) => {
  const uid = req.params.uid;

  const sql = "SELECT * FROM User WHERE uid = ?";
  conn.query(sql, [uid], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error", detail: err });
    if (result.length === 0) return res.status(404).json({ message: "User not found" });

    res.json(result[0]);
  });
});

