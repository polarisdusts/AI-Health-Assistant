const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const crypto = require("crypto");
const { Device, DeviceHeartRate, DeviceSteps, DeviceCalories, DeviceBloodOxygen, DeviceSleep, DeviceGpsTrack } = require("../models");
const { requireAuth } = require("../middleware/auth");

// ========== 设备绑定管理 ==========

// 生成新设备密钥并绑定
router.post("/bind", requireAuth, async (req, res) => {
  try {
    const { deviceName } = req.body;
    const deviceKey = "dev_" + crypto.randomBytes(24).toString("hex");
    const device = await Device.create({
      user_id: req.session.userId,
      device_name: deviceName || "智能手环",
      device_key: deviceKey,
      is_active: true,
      last_sync_at: new Date(),
    });
    res.status(201).json({
      message: "设备绑定成功",
      device: { id: device.id, name: device.device_name, key: device.device_key },
    });
  } catch (err) {
    console.error("设备绑定失败:", err.message);
    res.status(500).json({ error: "设备绑定失败" });
  }
});

// 解绑设备
router.post("/unbind/:id", requireAuth, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { id: req.params.id, user_id: req.session.userId } });
    if (!device) return res.status(404).json({ error: "设备不存在" });
    await device.update({ is_active: false });
    res.json({ message: "设备已解绑" });
  } catch (err) {
    res.status(500).json({ error: "解绑失败" });
  }
});

// 获取用户绑定的设备列表
router.get("/list", requireAuth, async (req, res) => {
  try {
    const devices = await Device.findAll({ where: { user_id: req.session.userId, is_active: true } });
    res.json({ devices: devices.map((d) => ({ id: d.id, name: d.device_name, lastSync: d.last_sync_at })) });
  } catch (err) {
    res.status(500).json({ error: "获取设备列表失败" });
  }
});

// ========== 设备数据上传（由设备/华为云IOT调用）==========

// 设备认证中间件 - 通过 device_key 验证
async function deviceAuth(req, res, next) {
  const deviceKey = req.headers["x-device-key"];
  if (!deviceKey) return res.status(401).json({ error: "缺少设备密钥" });
  const device = await Device.findOne({ where: { device_key: deviceKey, is_active: true } });
  if (!device) return res.status(403).json({ error: "设备密钥无效或设备已解绑" });
  req.device = device;
  req.deviceUserId = device.user_id;
  next();
}

// 通用数据上传接口 - 每30分钟调用的统一数据包
router.post("/upload", deviceAuth, async (req, res) => {
  try {
    const data = req.body;
    const device = req.device;
    const userId = req.deviceUserId;
    const now = new Date();
    const results = {};

    // 1. 心率数据
    if (data.heartRate) {
      const hr = await DeviceHeartRate.create({
        user_id: userId, device_id: device.id,
        max_hr: data.heartRate.max || null,
        avg_hr: data.heartRate.avg || null,
        record_time: data.heartRate.time || now,
      });
      results.heartRate = hr.id;
    }

    // 2. 步数数据
    if (data.steps) {
      const st = await DeviceSteps.create({
        user_id: userId, device_id: device.id,
        total_steps: data.steps.total,
        cadence: data.steps.cadence || null,
        record_time: data.steps.time || now,
      });
      results.steps = st.id;
    }

    // 3. 卡路里数据
    if (data.calories) {
      const cal = await DeviceCalories.create({
        user_id: userId, device_id: device.id,
        total_calories: data.calories.total,
        active_calories: data.calories.active || null,
        record_time: data.calories.time || now,
      });
      results.calories = cal.id;
    }

    // 4. 血氧数据
    if (data.bloodOxygen) {
      const bo = await DeviceBloodOxygen.create({
        user_id: userId, device_id: device.id,
        spo2: data.bloodOxygen.spo2,
        record_time: data.bloodOxygen.time || now,
      });
      results.bloodOxygen = bo.id;
    }

    // 5. 睡眠数据
    if (data.sleep) {
      const sl = await DeviceSleep.create({
        user_id: userId, device_id: device.id,
        sleep_date: data.sleep.date || now.toISOString().split("T")[0],
        total_sleep: data.sleep.totalSleep || 0,
        rem_sleep: data.sleep.remSleep || 0,
        light_sleep: data.sleep.lightSleep || 0,
        moderate_sleep: data.sleep.moderateSleep || 0,
        deep_sleep: data.sleep.deepSleep || 0,
      });
      results.sleep = sl.id;
    }

    // 6. GPS轨迹数据
    if (data.gpsTracks && Array.isArray(data.gpsTracks)) {
      const trackRecords = data.gpsTracks.map((gps) => ({
        user_id: userId, device_id: device.id,
        latitude: gps.lat, longitude: gps.lng,
        altitude: gps.alt || null, speed: gps.speed || null,
        record_time: gps.time || now,
      }));
      const bulkResult = await DeviceGpsTrack.bulkCreate(trackRecords);
      results.gpsTracks = bulkResult.length;
    }

    // 更新设备最后同步时间
    await device.update({ last_sync_at: now });

    res.json({ message: "数据上传成功", results });
  } catch (err) {
    console.error("设备数据上传失败:", err.message);
    res.status(500).json({ error: "数据上传失败" });
  }
});



// 获取最新设备数据摘要（仪表盘）
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const latestSteps = await DeviceSteps.findOne({ where: { user_id: userId, record_time: { [Op.gte]: today, [Op.lt]: tomorrow } }, order: [["record_time", "DESC"]] });
    const latestCalories = await DeviceCalories.findOne({ where: { user_id: userId, record_time: { [Op.gte]: today, [Op.lt]: tomorrow } }, order: [["record_time", "DESC"]] });
    const latestHR = await DeviceHeartRate.findOne({ where: { user_id: userId }, order: [["record_time", "DESC"]] });
    const latestBO = await DeviceBloodOxygen.findOne({ where: { user_id: userId }, order: [["record_time", "DESC"]] });
    const latestSleep = await DeviceSleep.findOne({ where: { user_id: userId }, order: [["sleep_date", "DESC"]] });
    res.json({
      steps: latestSteps ? { total: latestSteps.total_steps, cadence: latestSteps.cadence, time: latestSteps.record_time } : null,
      calories: latestCalories ? { total: latestCalories.total_calories, active: latestCalories.active_calories, time: latestCalories.record_time } : null,
      heartRate: latestHR ? { max: latestHR.max_hr, avg: latestHR.avg_hr, time: latestHR.record_time } : null,
      bloodOxygen: latestBO ? { spo2: latestBO.spo2, time: latestBO.record_time } : null,
      sleep: latestSleep ? { date: latestSleep.sleep_date, total: latestSleep.total_sleep, rem: latestSleep.rem_sleep, light: latestSleep.light_sleep, moderate: latestSleep.moderate_sleep, deep: latestSleep.deep_sleep } : null,
    });
  } catch (err) {
    console.error("获取设备摘要失败:", err.message);
    res.status(500).json({ error: "获取设备数据失败" });
  }
});

// 获取心率历史
router.get("/heart-rate", requireAuth, async (req, res) => {
  try {
    const records = await DeviceHeartRate.findAll({ where: { user_id: req.session.userId }, order: [["record_time", "ASC"]], limit: 50 });
    res.json({ records: records.map(function(r) { return { time: r.record_time, max: r.max_hr, avg: r.avg_hr }; }) });
  } catch (err) { res.status(500).json({ error: "获取心率数据失败" }); }
});

// 获取血氧历史
router.get("/blood-oxygen", requireAuth, async (req, res) => {
  try {
    const records = await DeviceBloodOxygen.findAll({ where: { user_id: req.session.userId }, order: [["record_time", "ASC"]], limit: 50 });
    res.json({ records: records.map(function(r) { return { time: r.record_time, spo2: r.spo2 }; }) });
  } catch (err) { res.status(500).json({ error: "获取血氧数据失败" }); }
});

// 获取睡眠历史
router.get("/sleep-history", requireAuth, async (req, res) => {
  try {
    const where = { user_id: req.session.userId };
    if (req.query.month) where.sleep_date = { [Op.startsWith]: req.query.month };
    const records = await DeviceSleep.findAll({ where, order: [["sleep_date", "ASC"]] });
    res.json({ records: records.map(function(r) { return { date: r.sleep_date, total: r.total_sleep, rem: r.rem_sleep, light: r.light_sleep, moderate: r.moderate_sleep, deep: r.deep_sleep }; }) });
  } catch (err) { res.status(500).json({ error: "获取睡眠数据失败" }); }
});

// 获取GPS轨迹
router.get("/gps-tracks", requireAuth, async (req, res) => {
  try {
    const where = { user_id: req.session.userId };
    if (req.query.activityId) where.activity_id = req.query.activityId;
    const records = await DeviceGpsTrack.findAll({ where, order: [["record_time", "ASC"]] });
    res.json({ records: records.map(function(r) { return { lat: r.latitude, lng: r.longitude, alt: r.altitude, speed: r.speed, time: r.record_time }; }) });
  } catch (err) { res.status(500).json({ error: "获取GPS数据失败" }); }
});

module.exports = router;