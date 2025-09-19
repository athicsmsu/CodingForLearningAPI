//###### โดนยปัญหาส่งเมลไม่ได้เพราะ Render Block SMTP เลยเปลี่ยนมาใช้ SendGrid แทน ######//

// import express from "express";
// import nodemailer from "nodemailer";
// export const router = express.Router();

// // ใช้ Gmail SMTP หรือของคุณเอง
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "", // ใส่อีเมลจริง
//     pass: "", // ใส่รหัสผ่านแอป (ไม่ใช่รหัส Gmail ปกติ)
//   },
// });

// // เปลี่ยน otpStore ให้เก็บ OTP, timeout และ expiresAt
// const otpStore = new Map<
//   string,
//   { otp: string; timeout: NodeJS.Timeout; expiresAt: number }
// >();

// // POST /api/send-otp
// router.post("/send-otp", async (req, res) => {
//   const { email } = req.body;
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const expiresInMs = 5 * 60 * 1000; // 5 นาที
//   const expiresAt = Date.now() + expiresInMs;

//   // ถ้ามี OTP เดิมอยู่แล้ว ให้เคลียร์ timeout ก่อน
//   if (otpStore.has(email)) {
//     clearTimeout(otpStore.get(email)!.timeout);
//   }

//   const timeout = setTimeout(() => {
//     otpStore.delete(email);
//     console.log(`OTP for ${email} expired.`);
//   }, expiresInMs);

//   otpStore.set(email, { otp, timeout, expiresAt });

//   const mailOptions = {
//     from: "your_email@gmail.com",
//     to: email,
//     subject: "Your OTP Code",
//     text: `Your OTP code is: ${otp} (valid for 5 minutes)`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: "OTP sent to email" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to send email", detail: error });
//   }
// });

// // POST /api/verify-otp
// router.post("/verify-otp", (req, res) => {
//   const { email, otp } = req.body;
//   const record = otpStore.get(email);

//   if (!record) {
//     return res.status(400).json({ message: "No OTP sent or already expired" });
//   }

//   if (Date.now() > record.expiresAt) {
//     clearTimeout(record.timeout);
//     otpStore.delete(email);
//     return res.status(400).json({ message: "OTP has expired" });
//   }

//   if (otp !== record.otp) {
//     return res.status(400).json({ message: "Invalid OTP" });
//   }

//   clearTimeout(record.timeout);
//   otpStore.delete(email);
//   res.status(200).json({ message: "OTP verified successfully" });
// });


import express from "express";
import "dotenv/config";
import sgMail from "@sendgrid/mail";

export const router = express.Router();

// ตั้งค่า API Key ของ SendGrid (เก็บใน .env)
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// เก็บ OTP, timeout และ expiresAt
const otpStore = new Map<
  string,
  { otp: string; timeout: NodeJS.Timeout; expiresAt: number }
>();

// POST /api/send-otp
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresInMs = 5 * 60 * 1000; // 5 นาที
  const expiresAt = Date.now() + expiresInMs;

  // ล้าง OTP เดิมถ้ามี
  if (otpStore.has(email)) {
    clearTimeout(otpStore.get(email)!.timeout);
  }

  const timeout = setTimeout(() => {
    otpStore.delete(email);
    console.log(`OTP for ${email} expired.`);
  }, expiresInMs);

  otpStore.set(email, { otp, timeout, expiresAt });

  // HTML Email สวย ๆ
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
      <h2 style="color: #4CAF50;">Coding-For-Learning OTP</h2>
      <p>Hello!</p>
      <p>Your OTP code is:</p>
      <div style="font-size: 36px; font-weight: bold; color: #FF5722; margin: 20px 0;">${otp}</div>
      <p style="font-size: 14px; color: #555;">This code is valid for 5 minutes.</p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #999;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL!, // ต้อง verify ใน SendGrid
    subject: "Your OTP Code - Coding-For-Learning",
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("SendGrid Error:", error);
    res.status(500).json({ error: "Failed to send email", detail: error });
  }
});


// POST /api/verify-otp
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ message: "No OTP sent or already expired" });
  }

  if (Date.now() > record.expiresAt) {
    clearTimeout(record.timeout);
    otpStore.delete(email);
    return res.status(400).json({ message: "OTP has expired" });
  }

  if (otp !== record.otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  clearTimeout(record.timeout);
  otpStore.delete(email);
  res.status(200).json({ message: "OTP verified successfully" });
});
