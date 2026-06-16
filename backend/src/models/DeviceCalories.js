const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DeviceCalories = sequelize.define("DeviceCalories", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  device_id: { type: DataTypes.INTEGER, allowNull: false },
  total_calories: { type: DataTypes.FLOAT, allowNull: false, comment: "累计消耗卡路里" },
  active_calories: { type: DataTypes.FLOAT, allowNull: true, comment: "活动消耗" },
  record_time: { type: DataTypes.DATE, allowNull: false },
});

module.exports = DeviceCalories;