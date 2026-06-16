const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DeviceGpsTrack = sequelize.define("DeviceGpsTrack", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  device_id: { type: DataTypes.INTEGER, allowNull: false },
  activity_id: { type: DataTypes.INTEGER, allowNull: true, comment: "关联的活动记录ID" },
  latitude: { type: DataTypes.FLOAT, allowNull: false, comment: "纬度" },
  longitude: { type: DataTypes.FLOAT, allowNull: false, comment: "经度" },
  altitude: { type: DataTypes.FLOAT, allowNull: true, comment: "海拔(米)" },
  speed: { type: DataTypes.FLOAT, allowNull: true, comment: "速度(km/h)" },
  record_time: { type: DataTypes.DATE, allowNull: false, comment: "轨迹点时间" },
});

module.exports = DeviceGpsTrack;