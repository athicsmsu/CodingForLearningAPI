import express from "express";
import { conn } from "../dbconnect";

export const router = express.Router();

interface HistoryRow {
  hid: number;
  pid: number;
  date: string;
  history_score: number;
  language: string;
  level: string;
  mission: string;
}

router.get("/list/:uid", (req, res) => {
  const uid = req.params.uid;

  let sql = `
    SELECT 
        History.hid,
        History.pid,
        History.date,
        History.score AS history_score,
        GamePlay.language,
        GamePlay.level,
        GamePlay.mission
    FROM 
        History
    JOIN 
        GamePlay ON History.pid = GamePlay.pid
    WHERE 
        GamePlay.uid = ?
    ORDER BY 
        History.hid DESC
  `;

  conn.query(sql, [uid], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    const formatted = results.map((row: HistoryRow) => {
  // Convert string to Date
  const utcDate = new Date(row.date);

  // Add 7 hours (เวลาไทย)
  const thaiDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);

  // Format ให้เป็น YYYY-MM-DD
  const formattedDate = thaiDate.toISOString().split("T")[0];

  return {
    hid: row.hid,
    pid: row.pid,
    date: formattedDate,
    score: row.history_score,
    language: row.language,
    level: row.level,
    mission: row.mission,
  };
});

    res.json(formatted);
  });
});
