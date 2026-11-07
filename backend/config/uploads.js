const path = require("node:path");

// Set UPLOAD_DIR to the mount path of a Render persistent disk when available.
const uploadDirectory = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, "..", "uploads");

module.exports = { uploadDirectory, avatarDirectory: path.join(uploadDirectory, "avatars") };
