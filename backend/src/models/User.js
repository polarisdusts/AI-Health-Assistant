const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 150 },
  },
  gender: {
    type: DataTypes.ENUM("male", "female", "other"),
    allowNull: true,
  },
  height: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: "身高(cm)",
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: "体重(kg)",
  },
  activity_level: {
    type: DataTypes.ENUM("low", "medium", "high"),
    allowNull: true,
    comment: "活动水平：低/中/高",
  },
  diet_preference: {
    type: DataTypes.ENUM("vegetarian", "balanced", "high_protein"),
    allowNull: true,
    comment: "饮食偏好：素食/均衡/高蛋白",
  },
  health_goal: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "健康目标描述",
  },
  daily_calorie_goal: {
    type: DataTypes.INTEGER,
    defaultValue: 600,
  },
  daily_step_goal: {
    type: DataTypes.INTEGER,
    defaultValue: 6000,
  },
  daily_activity_goal: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  remember_me: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = User;
