const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HealthPlan = sequelize.define("HealthPlan", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  plan_type: {
    type: DataTypes.ENUM("monthly", "daily"),
    allowNull: false,
    comment: "计划类型：月度/单次",
  },
  plan_month: {
    type: DataTypes.STRING(7),
    allowNull: true,
    comment: "计划所属月份，格式YYYY-MM",
  },
  plan_data: {
    type: DataTypes.TEXT("long"),
    allowNull: true,
    comment: "AI生成的计划内容(JSON)",
  },
  diet_plan: {
    type: DataTypes.TEXT("long"),
    allowNull: true,
    comment: "饮食计划",
  },
  exercise_plan: {
    type: DataTypes.TEXT("long"),
    allowNull: true,
    comment: "运动计划",
  },
  ai_analysis: {
    type: DataTypes.TEXT("long"),
    allowNull: true,
    comment: "AI分析上下文",
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  generated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = HealthPlan;
