import express from "express";
import {
  generateQR,
  getQueueById,
  joinQueue,
  getQueueStatus,
  getQueueList,
  callNext,
  markServed,
  skipUser,
  getQueueStats,
  getUserPosition
} from "../controllers/queueController.js";

const router = express.Router();

router.get("/qr/:id", generateQR); // ADDED: QR generation API
router.get("/status/:token", getQueueStatus); // ADDED: live queue status API
router.get("/list", getQueueList); // ADDED: staff queue list API
router.get("/stats", getQueueStats); // ADDED: staff stats API
router.get("/position/:token", getUserPosition); // ADDED: user position API
router.put("/call-next", callNext); // ADDED: staff call-next API
router.put("/mark-served", markServed); // ADDED: staff mark served
router.put("/skip", skipUser); // ADDED: staff skip user
router.get("/:id", getQueueById); // ADDED: queue details API for Join page
router.post("/join", joinQueue); // ADDED: join queue API

export default router;
