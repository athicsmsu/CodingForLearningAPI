import express from "express";
import { conn } from "../dbconnect";

export const router = express.Router();

// ✅ เพิ่ม GamePlay และ History พร้อมกัน
router.post("/add-gameplay", (req, res) => {
  const { uid, language, level, mission, score } = req.body;

  if (!uid || level == null || !mission || score == null) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const gameplaySql = `
    INSERT INTO GamePlay (uid, language, level, mission, score)
    VALUES (?, ?, ?, ?, ?)
  `;
  conn.query(
    gameplaySql,
    [uid, language, level, mission, score],
    (err, gameplayResult) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Insert gameplay failed", detail: err });
      }

      const pid = gameplayResult.insertId;

      // ใช้วันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
      const now = new Date();
      const dateNow = now.toISOString().slice(0, 10);

      const historySql = `
        INSERT INTO History (pid, date)
        VALUES (?, ?)
      `;
      conn.query(historySql, [pid, dateNow], (err2, historyResult) => {
        if (err2) {
          return res
            .status(500)
            .json({ error: "Insert history failed", detail: err2 });
        }

        res.status(200).json({
          message: "Gameplay and History added successfully",
          pid: pid,
          historyId: historyResult.insertId,
          date: dateNow,
        });
      });
    }
  );
});

// ✅ ดึง level ล่าสุดของผู้ใช้จาก GamePlay
router.get("/latest-level/:uid", (req, res) => {
  const uid = req.params.uid;

  if (!uid) {
    return res.status(400).json({ error: "Missing uid parameter" });
  }

  const sql = `
    SELECT level
    FROM GamePlay
    WHERE uid = ?
    ORDER BY pid DESC
    LIMIT 1
  `;

  conn.query(sql, [uid], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error", detail: err });
    }

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "No gameplay found for this uid" });
    }

    res.status(200).json({
      latestLevel: result[0].level,
    });
  });
});

