const express = require("express");
const multer = require("multer");
const uploadFileService = require("../services/uploadFileService");
const S3_CONSTANTS = require("../common/constant/S3Constant");

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Upload file endpoint
router.post("/chats/upload", upload.array("files", 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }
  console.log("start-uppppp");
  res.json(
    await uploadFileService.uploadFile(
      req.files,
      S3_CONSTANTS.AVATAR_PRIVATE_BUCKET,
      req.currentUser.email,
      req.body
    )
  );
});

module.exports = router;
