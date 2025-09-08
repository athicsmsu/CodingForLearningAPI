import express from "express";
import { conn } from "../dbconnect";
import mysql from "mysql";
import bcrypt from "bcrypt";

export const router = express.Router();

// POST /api/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  let sql = "SELECT * FROM User WHERE email = ?";
  sql = mysql.format(sql, [email]);

  conn.query(sql, async (err, result) => {
    if (err) return res.status(500).json({ status: "ServerError", message: "Database error", detail: err });
    if (result.length === 0) return res.status(401).json({ status: "InvalidCredentials", message: "Email or password is incorrect" });

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ status: "InvalidCredentials", message: "Email or password is incorrect" });

    if (user.status === 1) return res.status(403).json({ status: "AlreadyLoggedIn", message: "User already logged in elsewhere" });

    let updateSql = "UPDATE User SET status = 1 WHERE uid = ?";
    updateSql = mysql.format(updateSql, [user.uid]);

    conn.query(updateSql, (updateErr) => {
      if (updateErr) return res.status(500).json({ status: "ServerError", message: "Failed to update status", detail: updateErr });

      res.status(200).json({
        status: "Success",
        message: "Login successful",
        data: { uid: user.uid, name: user.name, email: user.email, status: true }
      });
    });
  });
});



// POST /api/logout
router.post("/logout", (req, res) => {
  const { uid } = req.body;

  let updateSql = "UPDATE User SET status = 0 WHERE uid = ?";
  const formattedSql = mysql.format(updateSql, [uid]);
  console.log("Logging out uid:", uid);

  conn.query(formattedSql, (err, result) => {
    if (err) {
      res.status(500).json({ error: "Failed to update status", detail: err });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: "User not found" });
    } else {
      res.status(200).json({ message: "Logout successful" });
    }
  });
});


// POST /api/register
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  let checkSql = "SELECT * FROM User WHERE email = ?";
  checkSql = mysql.format(checkSql, [email]);

  conn.query(checkSql, async (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ status: "ServerError", message: "DB error", detail: err });
    if (result.length > 0)
      return res
        .status(409)
        .json({ status: "EmailExists", message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    let insertSql =
      "INSERT INTO User (name, email, password, status) VALUES (?, ?, ?, ?)";
    insertSql = mysql.format(insertSql, [name, email, hashedPassword, false]);

    conn.query(insertSql, (err, result) => {
      if (err)
        return res
          .status(500)
          .json({
            status: "ServerError",
            message: "Insert failed",
            detail: err,
          });
      res
        .status(201)
        .json({
          status: "Success",
          message: "Registration successful",
          data: { uid: result.insertId },
        });
    });
  });
});

// POST /api/change-password
router.post("/change-password", (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  let checkSql = "SELECT * FROM User WHERE email = ?";
  const formattedCheckSql = mysql.format(checkSql, [email]);

  conn.query(formattedCheckSql, async (err, result) => {
    if (err) return res.status(500).json({ error: "Database error", detail: err });
    if (result.length === 0) return res.status(404).json({ message: "User not found" });

    const user = result[0];
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(401).json({ message: "Old password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    let updateSql = "UPDATE User SET password = ? WHERE email = ?";
    updateSql = mysql.format(updateSql, [hashedPassword, email]);

    conn.query(updateSql, (err) => {
      if (err) return res.status(500).json({ error: "Failed to update password", detail: err });
      res.status(200).json({ message: "Password changed successfully" });
    });
  });
});


// POST /api/reset-password
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updateSql = "UPDATE User SET password = ? WHERE email = ?";
  const formattedSql = mysql.format(updateSql, [hashedPassword, email]);

  conn.query(formattedSql, (err, result) => {
    if (err) {
      return res.status(500).json({
        status: "ServerError",
        message: "Failed to update password",
        detail: err
      });
    } 
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "UserNotFound",
        message: "User not found"
      });
    }
    return res.status(200).json({
      status: "Success",
      message: "Password changed successfully"
    });
  });
});


// POST /api/edit
router.post("/edit", (req, res) => {
  const { uid, name, newEmail, password, confirmPassword } = req.body;

  let getUserSql = "SELECT * FROM User WHERE uid = ?";
  let formattedGetUserSql = mysql.format(getUserSql, [uid]);

  conn.query(formattedGetUserSql, async (err, result) => {
    if (err) return res.status(500).json({ status: "ServerError", message: "Database error", detail: err });
    if (result.length === 0) return res.status(404).json({ status: "UserNotFound", message: "User not found" });

    const user = result[0];
    const updatedName = name || user.name;
    const updatedEmail = newEmail || user.email;

    if (password && password !== confirmPassword) {
      return res.status(400).json({ status: "PasswordMismatch", message: "Passwords do not match" });
    }

    let updatedPassword = user.password;
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    let checkEmailSql = "SELECT * FROM User WHERE email = ? AND uid != ?";
    let formattedCheckEmailSql = mysql.format(checkEmailSql, [updatedEmail, user.uid]);

    conn.query(formattedCheckEmailSql, (err, emailResult) => {
      if (err) return res.status(500).json({ status: "ServerError", message: "Database error", detail: err });
      if (emailResult.length > 0) return res.status(409).json({ status: "EmailExists", message: "Email already in use by another account" });

      let updateSql = "UPDATE User SET name = ?, email = ?, password = ? WHERE uid = ?";
      let formattedUpdateSql = mysql.format(updateSql, [updatedName, updatedEmail, updatedPassword, uid]);

      conn.query(formattedUpdateSql, (err) => {
        if (err) return res.status(500).json({ status: "ServerError", message: "Update failed", detail: err });

        res.status(200).json({
          status: "Success",
          message: "User updated successfully",
          data: {
            uid: user.uid,
            name: updatedName,
            email: updatedEmail,
            status: user.status === 1
          }
        });
      });
    });
  });
});


// POST /user/check-email
router.post("/check-email", (req, res) => {
  const { email, uid } = req.body;
  let checkEmailSql = "SELECT * FROM User WHERE email = ? AND uid != ?";
  let formattedCheckEmailSql = mysql.format(checkEmailSql, [email, uid]);

  conn.query(formattedCheckEmailSql, (err, result) => {
    if (err) return res.status(500).json({ status: "ServerError", message: err.message });
    if (result.length > 0) return res.status(409).json({ status: "EmailExists", message: "Email already in use" });
    res.status(200).json({ status: "Available", message: "Email available" });
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

