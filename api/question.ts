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
  const answers = req.body.answers;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: "Invalid answers format" });
  }

  const values = answers.map(ans => [ans.pid, ans.qid, ans.answer, ans.point]);

  const sql = "INSERT INTO QuestionNaire (pid, qid, answer, point) VALUES ?";
  conn.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ message: "Insert failed", error: err });
    }

    res.status(200).json({ message: "All answers inserted successfully" });
  });
});



