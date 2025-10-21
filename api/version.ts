import express from "express";
export const router = express.Router();

router.get("/version", (req, res) => {
  res.json({
    version: "1.0.2",
    message: "Latest app version",
  });
});
