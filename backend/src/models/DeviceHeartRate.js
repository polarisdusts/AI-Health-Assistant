const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DeviceHeartRate = sequelize.define("DeviceHeartRate", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  device_id: { type: DataTypes.INTEGER, allowNull: false },
  max_hr: { type: DataTypes.INTEGER, allowNull: true, comment: "最高心率" },
  avg_hr: { type: DataTypes.INTEGER, allowNull: true, comment: "平均心率" },
  record_time: { type: DataTypes.DATE, allowNull: false, comment: "数据记录时间" },
});

module.exports = DeviceHeartRate;