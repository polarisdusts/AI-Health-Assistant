const express = require("express");
const { ActivityRecord, WeightRecord } = require("../models");
const { requireAuth } = require("../middleware/auth");
const { Op } = require("sequelize");
const { generateMonthlyReport } = require("../utils/deepseekClient");

const router = express.Router();

// 获取月度报告
router.get("/monthly/:month", requireAuth, async (req, res) => {
  try {
    const { month } = req.params;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "月份格式错误，应为YYYY-MM" });
    }

    const [year, mon] = month.split("-").map(Number);
    const firstDay = new Date(year, mon - 1, 1).toISOString().split("T")[0];
    const lastDay = new Date(year, mon, 0).toISOString().split("T")[0];

    const activities = await ActivityRecord.findAll({
      where: {
        user_id: req.session.userId,
        record_date: { [Op.between]: [firstDay, lastDay] },
      },
    });

    const report = await generateMonthlyReport(activities, month);

    // 检查当月是否已结束
    const now = new Date();
    const isMonthEnded =
      now.getFullYear() > year || (now.getFullYear() === year && now.getMonth() + 1 > mon);
    // 或者当前月份的最后一天已过
    const monthEndDate = new Date(year, mon, 0);
    const isMonthOver = now > monthEndDate;

    res.json({
      report,
      isMonthEnded: isMonthOver,
      currentMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    });
  } catch (err) {
    console.error("获取月度报告失败:", err);
    res.status(500).json({ error: "获取月度报告失败" });
  }
});

// 获取当月累计数据（供前端仪表盘使用）
router.get("/current-summary", requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const activities = await ActivityRecord.findAll({
      where: {
        user_id: req.session.userId,
        record_date: { [Op.between]: [firstDay, lastDay] },
      },
    });

    // 获取今天的活动
    const today = now.toISOString().split("T")[0];
    const todayActivities = activities.filter((a) => a.record_date === today);

    const todayCalories = todayActivities.reduce((s, a) => s + a.calories_burned, 0);
    const todaySteps = todayActivities.reduce((s, a) => s + (a.steps_estimated || 0), 0);
    const todayActivitiesCount = todayActivities.length;
    const todayMVCount = todayActivities.filter((a) => a.is_moderate_vigorous).length;

    // 月度累计
    const monthlyCalories = activities.reduce((s, a) => s + a.calories_burned, 0);
    const monthlySteps = activities.reduce((s, a) => s + (a.steps_estimated || 0), 0);
    const monthlyActivitiesCount = activities.length;
    const monthlyMVCount = activities.filter((a) => a.is_moderate_vigorous).length;

    // 最近活动记录
    const recentActivities = activities
      .sort((a, b) => new Date(b.record_date) - new Date(a.record_date))
      .slice(0, 20);

    res.json({
      today: {
        calories: Math.round(todayCalories),
        steps: todaySteps,
        activities: todayActivitiesCount,
        mvCount: todayMVCount,
      },
      monthly: {
        calories: Math.round(monthlyCalories),
        steps: monthlySteps,
        activities: monthlyActivitiesCount,
        mvCount: monthlyMVCount,
      },
      recentActivities,
    });
  } catch (err) {
    console.error("获取汇总数据失败:", err);
    res.status(500).json({ error: "获取汇总数据失败" });
  }
});

module.exports = router;
