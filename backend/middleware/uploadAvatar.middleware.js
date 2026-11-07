const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs/promises");
const crypto = require("node:crypto");
const sharp = require("sharp");

const { avatarDirectory } = require("../config/uploads");
const invalidImage = () => Object.assign(new Error("Chỉ chấp nhận ảnh JPG, JPEG, PNG hoặc WEBP hợp lệ, tối đa 4096 × 4096 pixel."), { status: 400 });
const mimeFormats = { "image/jpeg": "jpeg", "image/jpg": "jpeg", "image/png": "png", "image/webp": "webp" };
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  fileFilter(req, file, cb) {
    cb(mimeFormats[file.mimetype] ? null : invalidImage(), Boolean(mimeFormats[file.mimetype]));
  },
});

async function normalizeAvatar(buffer, mimetype) {
  try {
    const image = sharp(buffer, { limitInputPixels: 4096 * 4096, failOn: "warning" });
    const metadata = await image.metadata();
    if (!mimeFormats[mimetype] || metadata.format !== mimeFormats[mimetype] || !metadata.width || !metadata.height
      || metadata.width > 4096 || metadata.height > 4096 || (metadata.pages || 1) !== 1) throw invalidImage();
    // Decode and re-encode; uploaded bytes, metadata and filenames are never served.
    return await image.rotate().resize(512, 512, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch { throw invalidImage(); }
}

module.exports = {
  normalizeAvatar,
  single(field) {
    const receive = upload.single(field);
    return (req, res, next) => receive(req, res, async error => {
      if (error) return next(error);
      if (!req.file) return next();
      try {
        const buffer = await normalizeAvatar(req.file.buffer, req.file.mimetype);
        const filename = `user-${req.user.id}-${crypto.randomUUID()}.webp`;
        await fs.mkdir(avatarDirectory, { recursive: true });
        const filePath = path.join(avatarDirectory, filename);
        await fs.writeFile(filePath, buffer, { flag: "wx" });
        req.file = { filename, path: filePath, mimetype: "image/webp", size: buffer.length };
        res.once("finish", () => {
          if (res.statusCode >= 400) fs.unlink(filePath).catch(error => console.error("AVATAR CLEANUP:", error));
        });
        next();
      } catch (error) { next(error); }
    });
  },
};
