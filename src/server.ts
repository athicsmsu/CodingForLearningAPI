import express from "express";
import bodyParser from "body-parser";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import cors from "cors";

// สร้าง express application
const app = express();
const port = 3000;

app.use(
  cors({
    origin: "*",
  })
);


// ตั้งค่า body parser
app.use(bodyParser.json());

// เปิดการเชื่อมต่อฐานข้อมูล SQLite
const db = new sqlite3.Database("./codingforlearning.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the SQLite database.");
});

// สร้าง API สำหรับการ login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM Users WHERE email = ? AND password = ?';
  
  db.get(sql, [email, password], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      return res.json({ message: 'Login Successful', user: row });
    } else {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
  });
});

// สร้าง API สำหรับการ register
app.post('/register', (req, res) => {
  const { name, email, password, image } = req.body;

  // ตรวจสอบว่าผู้ใช้งานนี้มีอยู่ในระบบแล้วหรือไม่
  const checkUserSql = 'SELECT * FROM Users WHERE email = ?';
  db.get(checkUserSql, [email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      return res.status(400).json({ message: 'User already exists' });
    } else {
      // เพิ่มผู้ใช้ใหม่ในฐานข้อมูล
      const insertUserSql = 'INSERT INTO Users (name, email, password, image) VALUES (?, ?, ?, ?)';
      db.run(insertUserSql, [name, email, password, image], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        return res.json({ message: 'User registered successfully', userId: this.lastID });
      });
    }
  });
});

// สร้าง API สำหรับการดึงข้อมูลผู้ใช้ทั้งหมด
app.get('/users', (req, res) => {
  const sql = 'SELECT * FROM Users';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ users: rows });
  });
});

interface CodeRequest {
  code: string;
}

app.post("/compile", (req, res) => {
  const body: CodeRequest = req.body;

  if (!body.code) {
    console.error("Code is missing in request"); // เพิ่มการ debug ทดสอบการ request
    return res.status(400).send("Code is required");
  }

  const code: string = body.code;

  // เขียนโค้ดลงในไฟล์ชั่วคราว
  const tempFileName = "TempCode.java";
  const className = path.basename(tempFileName, ".java");
  fs.writeFileSync(tempFileName, code);

  // คอมไพล์โค้ดโดยใช้ javac
  exec(
    `javac ${tempFileName}`,
    (compileError, compileStdout, compileStderr) => {
      if (compileError) {
        res.send(compileStderr);
      } else {
        // รันโค้ดโดยใช้ java
        exec(`java ${className}`, (runError, runStdout, runStderr) => {
          if (runError) {
            res.status(510).send(runStderr);
          } else {
            res.send(runStdout);
          }

          // ลบไฟล์ชั่วคราว
          fs.unlinkSync(tempFileName);
          fs.unlinkSync(`${className}.class`);
        });
      }
    }
  );
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
