const express = require("express");
const { ActivityRecord } = require("../models");
const { requireAuth } = require("../middleware/auth");
const { Op } = require("sequelize");

const router = express.Router();

const ACTIVITY_META = {
  outdoor_run: { name: "户外跑步", calPerMin: 9, stepsPerMin: 150, defaultMV: true },
  walking: { name: "健走", calPerMin: 5, stepsPerMin: 120, defaultMV: false },
  outdoor_cycle: { name: "户外骑行", calPerMin: 7, stepsPerMin: 90, defaultMV: true },
  indoor_run: { name: "室内跑步", calPerMin: 8, stepsPerMin: 140, defaultMV: true },
  jump_rope: { name: "跳绳", calPerMin: 10, stepsPerMin: 160, defaultMV: true },
  swimming: { name: "游泳", calPerMin: 8, stepsPerMin: 60, defaultMV: true },
  yoga: { name: "瑜伽", calPerMin: 3, stepsPerMin: 40, defaultMV: false },
  strength: { name: "力量训练", calPerMin: 6, stepsPerMin: 30, defaultMV: true },
  hiit: { name: "HIIT间歇", calPerMin: 11, stepsPerMin: 130, defaultMV: true },
  badminton: { name: "羽毛球", calPerMin: 7, stepsPerMin: 100, defaultMV: true },
  basketball: { name: "篮球", calPerMin: 8, stepsPerMin: 120, defaultMV: true },
  climbing: { name: "攀岩", calPerMin: 9, stepsPerMin: 50, defaultMV: true },
  boxing: { name: "拳击", calPerMin: 10, stepsPerMin: 100, defaultMV: true },
  dancing: { name: "舞蹈", calPerMin: 5, stepsPerMin: 80, defaultMV: true },
  other: { name: "其他运动", calPerMin: 5, stepsPerMin: 80, defaultMV: false },
};

router.post("/", requireAuth, async (req, res) => {
  try {
    let { activity_type, duration, distance } = req.body;
    if (!activity_type || !duration) {
      return res.status(400).json({ error: "请提供运动类型和时长" });
    }
    let meta = ACTIVITY_META[activity_type];
    if (!meta) {
      activity_type = "other";
      meta = ACTIVITY_META.other;
    }
    const isMV = meta.defaultMV;
    const avgHeartRate = isMV
      ? Math.round(120 + Math.random() * 30)
      : Math.round(90 + Math.random() * 20);
    const caloriesBurned = Math.round(duration * meta.calPerMin);
    const stepsEstimated = Math.round(duration * meta.stepsPerMin);
    const record = await ActivityRecord.create({
      user_id: req.session.userId,
      activity_type,
      activity_name: meta.name,
      duration,
      distance: distance || null,
      calories_burned: caloriesBurned,
      steps_estimated: stepsEstimated,
      is_moderate_vigorous: isMV,
      avg_heart_rate: avgHeartRate,
      record_date: new Date().toISOString().split("T")[0],
    });
    res.status(201).json({
      message: "运动记录成功",
      record: { ...record.toJSON(), activity_name: meta.name },
    });
  } catch (err) {
    console.error("添加记录失败:", err);
    res.status(500).json({ error: "添加记录失败" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const { start_date, end_date, limit } = req.query;
    const where = { user_id: req.session.userId };
    if (start_date && end_date) {
      where.record_date = { [Op.between]: [start_date, end_date] };
    } else if (start_date) {
      where.record_date = { [Op.gte]: start_date };
    } else if (end_date) {
      where.record_date = { [Op.lte]: end_date };
    }
    if (!start_date && !end_date) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      where.record_date = { [Op.between]: [firstDay, lastDay] };
    }
    const records = await ActivityRecord.findAll({
      where,
      order: [["record_date", "DESC"], ["id", "DESC"]],
      limit: limit ? parseInt(limit) : undefined,
    });
    const enriched = records.map((r) => {
      const data = r.toJSON();
      data.activity_name = ACTIVITY_META[r.activity_type]?.name || "其他运动";
      return data;
    });
    const totalCalories = enriched.reduce((s, a) => s + a.calories_burned, 0);
    const totalSteps = enriched.reduce((s, a) => s + (a.steps_estimated || 0), 0);
    const totalActivities = enriched.length;
    const mvCount = enriched.filter((a) => a.is_moderate_vigorous).length;
    res.json({ records: enriched, summary: { totalCalories, totalSteps, totalActivities, mvCount } });
  } catch (err) {
    console.error("获取记录失败:", err);
    res.status(500).json({ error: "获取记录失败" });
  }
});

router.get("/types", requireAuth, (req, res) => {
  const types = Object.entries(ACTIVITY_META).map(([key, val]) => ({ type: key, name: val.name }));
  res.json({ types });
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const record = await ActivityRecord.findOne({
      where: { id: req.params.id, user_id: req.session.userId },
    });
    if (!record) return res.status(404).json({ error: "记录未找到" });
    await record.destroy();
    res.json({ message: "记录已删除" });
  } catch (err) {
    res.status(500).json({ error: "删除失败" });
  }
});


// AI 运动分析
router.post("/ai-analysis", requireAuth, async (req, res) => {
  try {
    const { User } = require("../models");
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });
    const { generateActivityAnalysis } = require("../utils/deepseekClient");
    const analysis = await generateActivityAnalysis(user, req.body);
    res.json({ analysis });
  } catch (err) {
    console.error("AI 分析失败:", err.message);
    res.status(500).json({ error: "AI 分析失败" });
  }
});
module.exports = router;