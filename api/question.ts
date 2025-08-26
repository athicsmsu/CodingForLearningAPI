import express from "express";
import { conn } from "../dbconnect";
import mysql from "mysql";

export const router = express.Router();

// GET /api/question
router.get("/", (req, res) => {
  let sql = "SELECT * FROM Question";
  sql = mysql.format(sql); // ไม่มีพารามิเตอร์

  conn.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: "Database error", detail: err });
    } else {
      res.status(200).json({
        message: "Fetched all questions successfully",
        questions: result,
      });
    }
  });
});

router.post("/questionnaire/submit", (req, res) => {
  const { uid, answers } = req.body; // uid อยู่ root
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: "Invalid answers format" });
  }

  // ใช้ uid จาก root แทน ans.pid
  const values = answers.map(ans => [uid, ans.qid, ans.answer, ans.point]);

  const sql = "INSERT INTO QuestionNaire (uid, qid, answer, point) VALUES ?";
  conn.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ message: "Insert failed", error: err });
    }

    res.status(200).json({ message: "All answers inserted successfully" });
  });
});

// GET total points per level for a specific user
router.get("/questionnaire/total/:uid", (req, res) => {
  const uid = parseInt(req.params.uid);

  if (isNaN(uid)) return res.status(400).json({ message: "Invalid UID" });

  // สร้าง SQL รวมคะแนน point ตามช่วง qid
  const sql = `
    SELECT 
      SUM(CASE WHEN qid BETWEEN 1 AND 10 THEN point ELSE 0 END) AS java_easy,
      SUM(CASE WHEN qid BETWEEN 11 AND 20 THEN point ELSE 0 END) AS java_normal,
      SUM(CASE WHEN qid BETWEEN 21 AND 30 THEN point ELSE 0 END) AS java_hard,
      SUM(CASE WHEN qid BETWEEN 31 AND 40 THEN point ELSE 0 END) AS python_easy,
      SUM(CASE WHEN qid BETWEEN 41 AND 50 THEN point ELSE 0 END) AS python_normal,
      SUM(CASE WHEN qid BETWEEN 51 AND 60 THEN point ELSE 0 END) AS python_hard
    FROM QuestionNaire
    WHERE uid = ?
  `;

  conn.query(sql, [uid], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });

    res.status(200).json({ message: "Fetched total points successfully", totals: result[0] });
  });
});

// GET /api/questionnaire/check/:uid
router.get("/questionnaire/check/:uid", (req, res) => {
  const uid = req.params.uid;

  const sql = "SELECT COUNT(*) AS total FROM QuestionNaire WHERE uid = ?";
  conn.query(sql, [uid], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "DB error", detail: err });
    }
    const total = result[0].total;
    res.json({ answered: total > 0 }); // true ถ้าตอบแล้ว
  });
});




