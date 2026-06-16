const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DeviceSleep = sequelize.define("DeviceSleep", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  device_id: { type: DataTypes.INTEGER, allowNull: false },
  sleep_date: { type: DataTypes.DATEONLY, allowNull: false, comment: "睡眠日期" },
  total_sleep: { type: DataTypes.INTEGER, allowNull: false, comment: "总睡眠时长(分钟)" },
  rem_sleep: { type: DataTypes.INTEGER, allowNull: true, comment: "快速眼动(分钟)" },
  light_sleep: { type: DataTypes.INTEGER, allowNull: true, comment: "浅度睡眠(分钟)" },
  moderate_sleep: { type: DataTypes.INTEGER, allowNull: true, comment: "中度睡眠(分钟)" },
  deep_sleep: { type: DataTypes.INTEGER, allowNull: true, comment: "深度睡眠(分钟)" },
});

module.exports = DeviceSleep;