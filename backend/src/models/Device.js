const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Device = sequelize.define("Device", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, comment: "绑定的用户ID" },
  device_name: { type: DataTypes.STRING(100), allowNull: true, comment: "设备名称" },
  device_key: { type: DataTypes.STRING(64), allowNull: false, unique: true, comment: "设备独立密钥" },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true, comment: "是否启用" },
  last_sync_at: { type: DataTypes.DATE, allowNull: true, comment: "最后同步时间" },
});

module.exports = Device;