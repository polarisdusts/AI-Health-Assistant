const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DeviceBloodOxygen = sequelize.define("DeviceBloodOxygen", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  device_id: { type: DataTypes.INTEGER, allowNull: false },
  spo2: { type: DataTypes.FLOAT, allowNull: false, comment: "血氧饱和度(%)" },
  record_time: { type: DataTypes.DATE, allowNull: false },
});

module.exports = DeviceBloodOxygen;