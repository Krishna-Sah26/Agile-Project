import express from "express";
import DepartmentQueue from "../models/DepartmentQueue.js";
import Token from "../models/Token.js";

const router = express.Router();

// ADDED: admin dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const { organization } = req.query;

    const queueQuery = {};
    if (organization) {
      queueQuery.organization = organization;
    }

    const queues = await DepartmentQueue.find(queueQuery);
    const totalQueues = queues.length;

    const queueIds = queues.map((q) => q.queueId);
    const activeUsers = await Token.countDocuments({
      queueId: { $in: queueIds },
      status: "waiting"
    });

    let totalWait = 0;
    for (const q of queues) {
      const waiting = await Token.countDocuments({
        queueId: q.queueId,
        status: "waiting"
      });
      totalWait += waiting * (q.avgServiceTime || 5);
    }

    const avgWait = totalQueues ? Math.round(totalWait / totalQueues) : 0;

    return res.json({
      totalQueues,
      activeUsers,
      avgWait
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch dashboard stats",
      error: error.message
    });
  }
});

export default router;
