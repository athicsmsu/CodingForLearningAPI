import express from "express";
import { conn } from "../dbconnect";

export const router = express.Router();

router.post("/add-gameplay", (req, res) => {
  const { uid, language, level, mission, score } = req.body;

  if (!uid || level == null || !mission || score == null) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // ใช้วันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
  const now = new Date();
  const dateNow = now.toISOString().slice(0, 10);

  // ตรวจสอบว่ามี record นี้อยู่แล้วไหม
  const checkSql = `
    SELECT * FROM GamePlay
    WHERE uid = ? AND language = ? AND level = ?
    ORDER BY pid DESC
    LIMIT 1
  `;

  conn.query(checkSql, [uid, language, level], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error", detail: err });
    }

    if (result.length > 0) {
      const existing = result[0];

      if (score > existing.score) {
        // อัปเดต score ใหม่ + วันที่ใน History
        const updateSql = `
          UPDATE GamePlay
          SET score = ?, mission = ?
          WHERE pid = ?
        `;

        conn.query(updateSql, [score, mission, existing.pid], (err2) => {
          if (err2) {
            return res
              .status(500)
              .json({ error: "Update gameplay failed", detail: err2 });
          }

          const updateHistorySql = `
            UPDATE History
            SET date = ?
            WHERE pid = ?
          `;

          conn.query(updateHistorySql, [dateNow, existing.pid], (err3) => {
            if (err3) {
              return res
                .status(500)
                .json({ error: "Update history failed", detail: err3 });
            }

            res.status(200).json({
              message: "Score updated successfully",
              pid: existing.pid,
              updated: true,
              date: dateNow,
            });
          });
        });
      } else {
        // ไม่อัปเดตเพราะคะแนนใหม่น้อยกว่า
        res.status(200).json({
          message: "Existing score is higher or equal, no update performed",
          pid: existing.pid,
          updated: false,
        });
      }
    } else {
      // ถ้ายังไม่มีข้อมูล → แทรกใหม่
      const insertSql = `
        INSERT INTO GamePlay (uid, language, level, mission, score)
        VALUES (?, ?, ?, ?, ?)
      `;
      conn.query(
        insertSql,
        [uid, language, level, mission, score],
        (err4, gameplayResult) => {
          if (err4) {
            return res
              .status(500)
              .json({ error: "Insert gameplay failed", detail: err4 });
          }

          const pid = gameplayResult.insertId;

          const insertHistorySql = `
          INSERT INTO History (pid, date)
          VALUES (?, ?)
        `;
          conn.query(
            insertHistorySql,
            [pid, dateNow],
            (err5, historyResult) => {
              if (err5) {
                return res
                  .status(500)
                  .json({ error: "Insert history failed", detail: err5 });
              }

              res.status(200).json({
                message: "Gameplay and History added successfully",
                pid: pid,
                historyId: historyResult.insertId,
                date: dateNow,
                inserted: true,
              });
            }
          );
        }
      );
    }
  });
});


// ✅ ดึง level ล่าสุดของผู้ใช้จาก GamePlay ตาม uid และ language (ถ้าไม่เจอส่ง 1)
router.get("/latest-level/:uid/:language", (req, res) => {
  const uid = req.params.uid;
  const language = req.params.language;

  if (!uid || !language) {
    return res.status(400).json({ error: "Missing uid or language parameter" });
  }

  const sql = `
    SELECT level
    FROM GamePlay
    WHERE uid = ? AND language = ?
    ORDER BY pid DESC
    LIMIT 1
  `;

  conn.query(sql, [uid, language], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error", detail: err });
    }

    // ❌ ถ้าไม่พบข้อมูล
    if (result.length === 0) {
      return res.status(200).json({ latestLevel: 1 });
    }

    // ✅ ถ้าเจอข้อมูล → ตรวจสอบให้แน่ใจว่า `level` เป็นตัวเลข
    const level = parseInt(result[0].level, 10); // แปลงเป็นตัวเลข
    if (isNaN(level)) {
      return res.status(400).json({ error: "Invalid level data" });
    }

    res.status(200).json({
      latestLevel: level + 1, // บวก 1 หลังจากแปลงเป็นตัวเลข
    });
  });

});