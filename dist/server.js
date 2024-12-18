"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const cors_1 = __importDefault(require("cors"));
// สร้าง express application
const app = (0, express_1.default)();
const port = 3000;
app.use((0, cors_1.default)({
    origin: "*",
}));
// ตั้งค่า body parser
app.use(body_parser_1.default.json());
// เปิดการเชื่อมต่อฐานข้อมูล SQLite
const db = new sqlite3_1.default.Database("./codingforlearning.db", (err) => {
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
            return res.json({ message: 'Login successful', user: row });
        }
        else {
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
        }
        else {
            // เพิ่มผู้ใช้ใหม่ในฐานข้อมูล
            const insertUserSql = 'INSERT INTO Users (name, email, password, image) VALUES (?, ?, ?, ?)';
            db.run(insertUserSql, [name, email, password, image], function (err) {
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
app.post("/compile", (req, res) => {
    const body = req.body;
    if (!body.code) {
        console.error("Code is missing in request"); // เพิ่มการ debug
        return res.status(400).send("Code is required");
    }
    const code = body.code;
    // เขียนโค้ดลงในไฟล์ชั่วคราว
    const tempFileName = "TempCode.java";
    const className = path_1.default.basename(tempFileName, ".java");
    fs_1.default.writeFileSync(tempFileName, code);
    // คอมไพล์โค้ดโดยใช้ javac
    (0, child_process_1.exec)(`javac ${tempFileName}`, (compileError, compileStdout, compileStderr) => {
        if (compileError) {
            res.send(compileStderr);
        }
        else {
            // รันโค้ดโดยใช้ java
            (0, child_process_1.exec)(`java ${className}`, (runError, runStdout, runStderr) => {
                if (runError) {
                    res.status(510).send(runStderr);
                }
                else {
                    res.send(runStdout);
                }
                // ลบไฟล์ชั่วคราว
                fs_1.default.unlinkSync(tempFileName);
                fs_1.default.unlinkSync(`${className}.class`);
            });
        }
    });
});
// เริ่มต้นเซิร์ฟเวอร์
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
