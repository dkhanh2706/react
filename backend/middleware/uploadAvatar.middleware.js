const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================================
// THƯ MỤC AVATAR
// =====================================================

const avatarDirectory = path.join(__dirname, "..", "uploads", "avatars");

// Tự tạo folder nếu chưa tồn tại
fs.mkdirSync(avatarDirectory, {
  recursive: true,
});

// =====================================================
// STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDirectory);
  },

  filename: (req, file, cb) => {
    const userId = req.user?.id || req.user?.user_id || "unknown";

    const extension = path.extname(file.originalname).toLowerCase();

    const random = Math.round(Math.random() * 1e9);

    const filename = `user-${userId}-${Date.now()}-${random}${extension}`;

    cb(null, filename);
  },
});

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Chỉ chấp nhận ảnh JPG, JPEG, PNG hoặc WEBP"));
  }

  cb(null, true);
};

// =====================================================
// MULTER
// =====================================================

const uploadAvatar = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

module.exports = uploadAvatar;
