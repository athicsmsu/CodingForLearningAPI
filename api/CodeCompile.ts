import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

import { conn } from "../dbconnect";
import mysql from "mysql";

export const router = express.Router();

interface CodeRequest {
  code: string;
}

router.post("/compile", (req, res) => {
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

router.post("/compile-python", (req, res) => {
  const body: CodeRequest = req.body;

  if (!body.code) {
    return res.status(400).send("Code is required");
  }

  const code: string = body.code;

  // เขียนโค้ด Python ลงในไฟล์ชั่วคราว
  const tempFileName = "TempCode.py";
  fs.writeFileSync(tempFileName, code);

  // รันโค้ด Python โดยใช้ python3
  exec(`python3 ${tempFileName}`, (error, stdout, stderr) => {
    if (error) {
      res.status(510).send(stderr);
    } else {
      res.send(stdout);
    }

    // ลบไฟล์ชั่วคราว
    fs.unlinkSync(tempFileName);
  });
});