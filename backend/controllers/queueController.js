import QRCode from "qrcode";
import Token from "../models/Token.js"; // ADDED: token model for DB storage
import DepartmentQueue from "../models/DepartmentQueue.js"; // ADDED: admin queues
import sendSMS from "../utils/sendSMS.js"; // ADDED: Twilio SMS helper

// NOTE: queues are now stored in MongoDB (DepartmentQueue)

export const generateQR = async (req, res) => {

  const { id } = req.params;

  const joinUrl = `http://localhost:5173/join/${id}`; // ADDED: QR target URL

  try {

    const qr = await QRCode.toDataURL(joinUrl); // ADDED: generate base64 QR image

    res.json({
      success: true,
      qr: qr
    });

  } catch (error) {

    res.status(500).json({
      error: "QR generation failed"
    });

  }

};

// ADDED: fetch queue details by ID for Join Queue page
export const getQueueById = async (req, res) => {
  const { id } = req.params;
  const queue = await DepartmentQueue.findOne({ queueId: id });
  if (!queue) {
    return res.status(404).json({
      success: false,
      message: "Queue not found"
    });
  }

  return res.json({
    success: true,
    queue: {
      id: queue.queueId,
      title: queue.name,
      subtitle: queue.organization || "General Queue",
      status: queue.status.toUpperCase(),
      estWaitTime: `${queue.avgServiceTime} mins`,
      peopleAhead: 0
    }
  });
};

// ADDED: join queue API
export const joinQueue = async (req, res) => {
  try {
    const { queueId, name, phone } = req.body;

    if (!queueId || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "queueId, name and phone are required"
      });
    }

    // ADDED: India-only phone validation (+91XXXXXXXXXX or 10 digits)
    const phoneTrimmed = String(phone).trim();
    const isIndiaLocal = /^\d{10}$/.test(phoneTrimmed);
    const isIndiaIntl = /^\+91\d{10}$/.test(phoneTrimmed);
    if (!isIndiaLocal && !isIndiaIntl) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid India number (+91 followed by 10 digits)"
      });
    }

    const queue = await DepartmentQueue.findOne({ queueId });
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "Queue not found"
      });
    }

    if (queue.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Queue is paused"
      });
    }

    // ADDED: find latest token for this queue from DB
    const lastToken = await Token.findOne({ queueId }).sort({ tokenNumber: -1 });
    const nextTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;
    const token = `A-${String(nextTokenNumber).padStart(3, "0")}`; // ADDED: token format A-001

    // ADDED: create token entry in MongoDB token collection
    const newToken = new Token({
      queueId,
      token,
      tokenNumber: nextTokenNumber,
      name,
      phone,
      status: "waiting"
    });

    await newToken.save();

    // ADDED: compute position + wait for SMS
    const nowServingDoc = await Token.findOne({
      queueId,
      status: "serving"
    }).sort({ updatedAt: -1 });

    const nowServingNumber = nowServingDoc?.token
      ? Number(nowServingDoc.token.split("-")[1])
      : 0;

    const position = nowServingNumber > 0
      ? Math.max(newToken.tokenNumber - nowServingNumber - 1, 0)
      : Math.max(newToken.tokenNumber - 1, 0);

    const waitTime = position * (queue?.avgServiceTime || 5);

    // ADDED: normalize phone for SMS
    const cleanPhone = String(phone || "").replace(/\s+/g, "");
    const toNumber = cleanPhone.startsWith("+")
      ? cleanPhone
      : `+91${cleanPhone}`;

    // ADDED: send SMS confirmation (best effort)
    const smsMessage =
      `CampusQ Confirmation\n` +
      `Department: ${queue.name}\n` +
      `Token: ${newToken.token}\n` +
      `People Ahead: ${position}\n` +
      `Estimated Wait: ${waitTime} mins`;

    const smsResult = await sendSMS(toNumber, smsMessage);
    if (!smsResult?.success) {
      console.log("SMS send failed:", smsResult?.error || "unknown error");
    }

    // ADDED: realtime emit when a new user joins
    const io = req.app.get("io");
    if (io) {
      io.to(`queue:${queueId}`).emit("queueUpdated", {
        queueId,
        token: newToken.token,
        status: newToken.status
      });
    }

    return res.json({
      success: true,
      message: "Joined queue successfully",
      token: newToken.token, // ADDED: primary token field for status route
      tokenNumber: newToken.token, // ADDED: backward compatibility with old frontend
      smsSent: smsResult?.success || false,
      smsError: smsResult?.success ? undefined : (smsResult?.error || "SMS failed")
    });
  } catch (error) {
    // ADDED: handle duplicate token errors
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Token already exists. Please try again."
      });
    }
    return res.status(500).json({
      success: false,
      message: "Unable to join queue",
      error: error.message
    });
  }
};

// ADDED: live status API for token page
export const getQueueStatus = async (req, res) => {
  try {
    const { token } = req.params;
    const { queueId } = req.query;

    const userToken = queueId
      ? await Token.findOne({ token, queueId })
      : await Token.findOne({ token }).sort({ createdAt: -1 });
    if (!userToken) {
      return res.status(404).json({
        success: false,
        message: "Token not found"
      });
    }

    const queue = await DepartmentQueue.findOne({ queueId: userToken.queueId });

    // ADDED: now serving token in same queue
    const nowServingDoc = await Token.findOne({
      queueId: userToken.queueId,
      status: "serving"
    }).sort({ updatedAt: -1 });

    // ADDED: users ahead in waiting list
    // ADDED: position based on token order vs now serving
    let position = 0;
    if (userToken.status === "waiting") {
      const nowServingNumber = nowServingDoc?.token
        ? Number(nowServingDoc.token.split("-")[1])
        : 0;
      position = nowServingNumber > 0
        ? Math.max(userToken.tokenNumber - nowServingNumber - 1, 0)
        : Math.max(userToken.tokenNumber - 1, 0);
    }

    const estimatedWaitTime = position * (queue?.avgServiceTime || 5);

    return res.json({
      success: true,
      token: userToken.token,
      userStatus: userToken.status, // ADDED: current user's status
      nowServing: nowServingDoc?.token || "None",
      position,
      waitTime: estimatedWaitTime,
      queue: queue
        ? {
            id: queue.queueId,
            title: queue.name,
            subtitle: queue.organization || "General Queue",
            status: queue.status.toUpperCase(),
            estWaitTime: `${queue.avgServiceTime} mins`
          }
        : null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch queue status",
      error: error.message
    });
  }
};

// ADDED: list queue entries for staff dashboard
export const getQueueList = async (req, res) => {
  try {
    const { queueId, status = "waiting", limit } = req.query;

    const query = { status };
    if (queueId) {
      query.queueId = queueId;
    }

    let q = Token.find(query).sort({ createdAt: 1 });
    if (limit) {
      q = q.limit(Number(limit));
    }

    const users = await q.exec();

    return res.json({
      success: true,
      users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch queue list",
      error: error.message
    });
  }
};

// ADDED: staff "Call Next" - move next waiting user to serving
export const callNext = async (req, res) => {
  try {
    const { queueId } = req.body || {};

    const query = { status: "waiting" };
    if (queueId) {
      query.queueId = queueId;
    }

    // ADDED: mark current serving as completed for this queue (optional cleanup)
    const servingQuery = { status: "serving" };
    if (queueId) {
      servingQuery.queueId = queueId;
    }
    await Token.findOneAndUpdate(servingQuery, { status: "completed" });

    const nextUser = await Token.findOneAndUpdate(
      query,
      { status: "serving" },
      { new: true, sort: { createdAt: 1 } }
    );

    // ADDED: realtime emit to queue room only
    const io = req.app.get("io");
    if (io) {
      io.to(`queue:${nextUser?.queueId || queueId}`).emit("queueUpdated", {
        queueId: nextUser?.queueId || queueId || null,
        token: nextUser?.token || null,
        status: nextUser?.status || null
      });
    }

    return res.json({
      success: true,
      nextUser
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to call next user",
      error: error.message
    });
  }
};

// ADDED: mark a serving user as completed
export const markServed = async (req, res) => {
  try {
    const { token, queueId } = req.body || {};
    if (!token && !queueId) {
      return res.status(400).json({
        success: false,
        message: "token or queueId is required"
      });
    }

    const query = token
      ? { token, ...(queueId ? { queueId } : {}) }
      : { queueId, status: "serving" };
    const updated = await Token.findOneAndUpdate(
      query,
      { status: "completed" },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Serving token not found"
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`queue:${updated?.queueId || queueId}`).emit("queueUpdated", {
        queueId: updated?.queueId || queueId || null,
        token: updated?.token || token || null,
        status: updated?.status || "completed"
      });
    }

    return res.json({
      success: true,
      user: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to mark served",
      error: error.message
    });
  }
};

// ADDED: skip a waiting user (move to end)
export const skipUser = async (req, res) => {
  try {
    const { token, queueId } = req.body || {};
    if (!token && !queueId) {
      return res.status(400).json({
        success: false,
        message: "token or queueId is required"
      });
    }

    const query = token
      ? { token, ...(queueId ? { queueId } : {}) }
      : { queueId, status: "waiting" };
    const skipped = await Token.findOneAndUpdate(
      query,
      { status: "waiting", createdAt: new Date() },
      { new: true }
    );
    if (!skipped) {
      return res.status(404).json({
        success: false,
        message: "Waiting token not found"
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`queue:${skipped?.queueId || queueId}`).emit("queueUpdated", {
        queueId: skipped?.queueId || queueId || null,
        token: skipped?.token || token || null,
        status: skipped?.status || "waiting"
      });
    }

    return res.json({
      success: true,
      user: skipped
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to skip user",
      error: error.message
    });
  }
};

// ADDED: stats for staff dashboard (served today)
export const getQueueStats = async (req, res) => {
  try {
    const { queueId } = req.query;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const query = {
      status: "completed",
      updatedAt: { $gte: startOfDay }
    };
    if (queueId) {
      query.queueId = queueId;
    }

    const servedToday = await Token.countDocuments(query);

    return res.json({
      success: true,
      servedToday
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch stats",
      error: error.message
    });
  }
};

// ADDED: get user position + estimated wait by token
export const getUserPosition = async (req, res) => {
  try {
    const { token } = req.params;
    const { queueId } = req.query;

    const userToken = queueId
      ? await Token.findOne({ token, queueId })
      : await Token.findOne({ token }).sort({ createdAt: -1 });
    if (!userToken) {
      return res.status(404).json({
        success: false,
        message: "Token not found"
      });
    }

    const queue = await DepartmentQueue.findOne({ queueId: userToken.queueId });
    const SERVICE_TIME = queue?.avgServiceTime || 5; // ADDED: per-queue service time

    // ADDED: position based on token order vs now serving
    let position = 0;
    if (userToken.status === "waiting") {
      const nowServingDoc = await Token.findOne({
        queueId: userToken.queueId,
        status: "serving"
      }).sort({ updatedAt: -1 });

      const nowServingNumber = nowServingDoc?.token
        ? Number(nowServingDoc.token.split("-")[1])
        : 0;

      position = nowServingNumber > 0
        ? Math.max(userToken.tokenNumber - nowServingNumber - 1, 0)
        : Math.max(userToken.tokenNumber - 1, 0);
    }

    return res.json({
      success: true,
      position,
      estimatedWait: position * SERVICE_TIME
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch position",
      error: error.message
    });
  }
};

// ADDED: admin create queue
export const createQueue = async (req, res) => {
  try {
    const { name, avgServiceTime = 5, organization = "" } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Queue name is required"
      });
    }

    // ADDED: validate name (letters/numbers/spaces only)
    if (!/^[A-Za-z0-9\s]+$/.test(String(name).trim())) {
      return res.status(400).json({
        success: false,
        message: "Department name can contain only letters and numbers"
      });
    }

    // ADDED: validate avg service time (1-30 minutes)
    const avgTime = Number(avgServiceTime);
    if (!avgTime || avgTime < 1 || avgTime > 30) {
      return res.status(400).json({
        success: false,
        message: "Avg Service Time must be between 1 and 30 minutes"
      });
    }

    // ADDED: generate unique queueId
    let queueId = `Q-${Math.floor(1000 + Math.random() * 9000)}`;
    while (await DepartmentQueue.findOne({ queueId })) {
      queueId = `Q-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const queue = await DepartmentQueue.create({
      name: String(name).trim(),
      avgServiceTime: avgTime,
      organization,
      queueId
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("queueCreated", queue);
    }

    return res.json({
      success: true,
      queue
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create queue",
      error: error.message
    });
  }
};

// ADDED: admin list queues
export const listQueues = async (req, res) => {
  try {
    const { organization } = req.query;
    const query = {};
    if (organization) {
      query.organization = organization;
    }
    const queues = await DepartmentQueue.find(query).sort({ createdAt: 1 });

    // ADDED: active waiting users per queue
    const queueIds = queues.map((q) => q.queueId);
    const counts = queueIds.length
      ? await Token.aggregate([
          {
            $match: {
              status: "waiting",
              queueId: { $in: queueIds }
            }
          },
          {
            $group: { _id: "$queueId", count: { $sum: 1 } }
          }
        ])
      : [];

    const countMap = counts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const queuesWithCounts = queues.map((q) => ({
      ...q.toObject(),
      activeUsers: countMap[q.queueId] || 0
    }));

    return res.json({
      success: true,
      queues: queuesWithCounts
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch queues",
      error: error.message
    });
  }
};

// ADDED: admin toggle queue status
export const toggleQueueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const queue = await DepartmentQueue.findById(id);
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "Queue not found"
      });
    }

    queue.status = queue.status === "open" ? "paused" : "open";
    await queue.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("queueStatusChanged", queue);
    }

    return res.json({
      success: true,
      queue
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to toggle queue",
      error: error.message
    });
  }
};
