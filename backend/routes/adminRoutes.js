import express from "express";
import {
  createQueue,
  listQueues,
  toggleQueueStatus
} from "../controllers/queueController.js";

const router = express.Router();

router.post("/create-queue", createQueue); // ADDED: admin create queue
router.get("/queues", listQueues); // ADDED: admin list queues
router.put("/toggle-queue/:id", toggleQueueStatus); // ADDED: admin toggle queue

export default router;
