const express = require("express");
const { HealthPlan, User, WeightRecord, ActivityRecord } = require("../models");
const { requireAuth } = require("../middleware/auth");
const { buildWeightTrendContext, buildMonthlySummary, buildAIPrompt } = require("../utils/promptBuilder");
const { generateMonthlyPlan } = require("../utils/deepseekClient");

const router = express.Router();

// 生成月度计划
router.post("/generate-monthly", requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }

    // 检查是否已填写健康档案
    if (!user.age || !user.height || !user.weight) {
      return res.status(400).json({
        error: "请先完善个人健康档案",
        needProfile: true,
      });
    }

    // 获取体重历史
    const weightRecords = await WeightRecord.findAll({
      where: { user_id: user.id },
      order: [["record_date", "ASC"]],
    });
    const weightContext = buildWeightTrendContext(weightRecords);

    // 获取本月运动数据
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const activities = await ActivityRecord.findAll({
      where: {
        user_id: user.id,
        record_date: { [require("sequelize").Op.between]: [firstDay, lastDay] },
      },
    });

    const monthlySummary = buildMonthlySummary(activities, month);

    // 模拟调用AI（后续替换为真实DeepSeek API）
    const planData = await generateMonthlyPlan(user, weightContext, monthlySummary);
    const promptText = buildAIPrompt(user, weightContext, monthlySummary);

    // 存储计划
    const plan = await HealthPlan.create({
      user_id: user.id,
      plan_type: "monthly",
      plan_month: month,
      plan_data: JSON.stringify(planData),
      diet_plan: JSON.stringify(planData.diet_plan),
      exercise_plan: JSON.stringify(planData.exercise_plan),
      ai_analysis: promptText,
    });

    res.status(201).json({
      message: "月度计划已生成",
      plan: {
        id: plan.id,
        plan_month: month,
        diet_plan: planData.diet_plan,
        exercise_plan: planData.exercise_plan,
        summary: planData.summary,
        generated_at: plan.generated_at,
      },
    });
  } catch (err) {
    console.error("生成计划失败:", err);
    res.status(500).json({ error: "生成计划失败" });
  }
});

// 获取当前活跃计划
router.get("/active", requireAuth, async (req, res) => {
  try {
    const plan = await HealthPlan.findOne({
      where: { user_id: req.session.userId, is_active: true },
      order: [["generated_at", "DESC"]],
    });

    if (!plan) {
      return res.json({ plan: null });
    }

    res.json({
      plan: {
        id: plan.id,
        plan_type: plan.plan_type,
        plan_month: plan.plan_month,
        diet_plan: plan.diet_plan ? JSON.parse(plan.diet_plan) : null,
        exercise_plan: plan.exercise_plan ? JSON.parse(plan.exercise_plan) : null,
        plan_data: plan.plan_data ? JSON.parse(plan.plan_data) : null,
        summary: plan.plan_data ? JSON.parse(plan.plan_data).summary : null,
        generated_at: plan.generated_at,
      },
    });
  } catch (err) {
    console.error("获取计划失败:", err);
    res.status(500).json({ error: "获取计划失败" });
  }
});

// 获取所有历史计划
router.get("/history", requireAuth, async (req, res) => {
  try {
    const plans = await HealthPlan.findAll({
      where: { user_id: req.session.userId },
      order: [["generated_at", "DESC"]],
    });

    res.json({
      plans: plans.map((p) => ({
        id: p.id,
        plan_type: p.plan_type,
        plan_month: p.plan_month,
        summary: p.plan_data ? JSON.parse(p.plan_data).summary : null,
        generated_at: p.generated_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "获取历史计划失败" });
  }
});

module.exports = router;

