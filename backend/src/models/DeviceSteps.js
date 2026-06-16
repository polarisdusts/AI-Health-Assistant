const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DeviceSteps = sequelize.define("DeviceSteps", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  device_id: { type: DataTypes.INTEGER, allowNull: false },
  total_steps: { type: DataTypes.INTEGER, allowNull: false, comment: "累计步数" },
  cadence: { type: DataTypes.FLOAT, allowNull: true, comment: "步频(步/分钟)" },
  record_time: { type: DataTypes.DATE, allowNull: false },
});

module.exports = DeviceSteps;