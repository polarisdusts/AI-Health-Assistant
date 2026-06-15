const express = require("express");
const { WeightRecord } = require("../models");
const { requireAuth } = require("../middleware/auth");
const { Op } = require("sequelize");

const router = express.Router();

// 记录体重
router.post("/", requireAuth, async (req, res) => {
  try {
    const { weight, note } = req.body;
    if (!weight) {
      return res.status(400).json({ error: "请填写体重" });
    }
    const today = new Date().toISOString().split("T")[0];
    const existing = await WeightRecord.findOne({
      where: { user_id: req.session.userId, record_date: today },
    });
    if (existing) {
      existing.weight = weight;
      if (note) existing.note = note;
      await existing.save();
      return res.json({ message: "体重已更新", record: existing });
    }
    const record = await WeightRecord.create({
      user_id: req.session.userId,
      weight,
      record_date: today,
      note: note || "",
    });
    res.status(201).json({ message: "体重记录成功", record });
  } catch (err) {
    res.status(500).json({ error: "记录失败" });
  }
});

// 获取体重记录
router.get("/", requireAuth, async (req, res) => {
  try {
    const records = await WeightRecord.findAll({
      where: { user_id: req.session.userId },
      order: [["record_date", "DESC"]],
    });
    res.json({ records });
  } catch (err) {
    console.error("获取体重记录失败:", err);
    res.status(500).json({ error: "获取体重记录失败" });
  }
});
module.exports = router;
