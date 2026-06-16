const sequelize = require("../config/database");
const User = require("./User");
const WeightRecord = require("./WeightRecord");
const ActivityRecord = require("./ActivityRecord");
const HealthPlan = require("./HealthPlan");
const Device = require("./Device");
const DeviceHeartRate = require("./DeviceHeartRate");
const DeviceSteps = require("./DeviceSteps");
const DeviceCalories = require("./DeviceCalories");
const DeviceBloodOxygen = require("./DeviceBloodOxygen");
const DeviceSleep = require("./DeviceSleep");
const DeviceGpsTrack = require("./DeviceGpsTrack");

// 用户关联
User.hasMany(WeightRecord, { foreignKey: "user_id", onDelete: "CASCADE" });
WeightRecord.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(ActivityRecord, { foreignKey: "user_id", onDelete: "CASCADE" });
ActivityRecord.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(HealthPlan, { foreignKey: "user_id", onDelete: "CASCADE" });
HealthPlan.belongsTo(User, { foreignKey: "user_id" });

// 设备关联
User.hasMany(Device, { foreignKey: "user_id", onDelete: "CASCADE" });
Device.belongsTo(User, { foreignKey: "user_id" });

Device.hasMany(DeviceHeartRate, { foreignKey: "device_id", onDelete: "CASCADE" });
DeviceHeartRate.belongsTo(Device, { foreignKey: "device_id" });

Device.hasMany(DeviceSteps, { foreignKey: "device_id", onDelete: "CASCADE" });
DeviceSteps.belongsTo(Device, { foreignKey: "device_id" });

Device.hasMany(DeviceCalories, { foreignKey: "device_id", onDelete: "CASCADE" });
DeviceCalories.belongsTo(Device, { foreignKey: "device_id" });

Device.hasMany(DeviceBloodOxygen, { foreignKey: "device_id", onDelete: "CASCADE" });
DeviceBloodOxygen.belongsTo(Device, { foreignKey: "device_id" });

Device.hasMany(DeviceSleep, { foreignKey: "device_id", onDelete: "CASCADE" });
DeviceSleep.belongsTo(Device, { foreignKey: "device_id" });

Device.hasMany(DeviceGpsTrack, { foreignKey: "device_id", onDelete: "CASCADE" });
DeviceGpsTrack.belongsTo(Device, { foreignKey: "device_id" });

// 便捷关联：用户直接访问设备数据
User.hasMany(DeviceHeartRate, { foreignKey: "user_id", onDelete: "CASCADE" });
User.hasMany(DeviceSteps, { foreignKey: "user_id", onDelete: "CASCADE" });
User.hasMany(DeviceCalories, { foreignKey: "user_id", onDelete: "CASCADE" });
User.hasMany(DeviceBloodOxygen, { foreignKey: "user_id", onDelete: "CASCADE" });
User.hasMany(DeviceSleep, { foreignKey: "user_id", onDelete: "CASCADE" });
User.hasMany(DeviceGpsTrack, { foreignKey: "user_id", onDelete: "CASCADE" });

module.exports = {
  sequelize,
  User,
  WeightRecord,
  ActivityRecord,
  HealthPlan,
  Device,
  DeviceHeartRate,
  DeviceSteps,
  DeviceCalories,
  DeviceBloodOxygen,
  DeviceSleep,
  DeviceGpsTrack,
};