const express = require("express");

const router = express.Router();

const chatController = require("../controllers/chat.controller");
const live = require('../controllers/liveChat.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const rateLimit = require('../middleware/rateLimit');

router.post('/session', rateLimit({ max: 30 }), live.create);
router.post('/sync', live.sync);
router.post('/messages', rateLimit({ max: 120, windowMs: 60000 }), live.send);
router.post('/bot', live.bot);
router.post('/request', live.request);
router.post('/cancel', live.cancel);
router.post('/admin/state', verifyToken, isAdmin, live.adminState);
router.post('/admin/logout', verifyToken, isAdmin, live.logout);
router.post('/admin/:id', verifyToken, isAdmin, live.adminConversation);

router.post("/", rateLimit({ max: 20, windowMs: 60000 }), chatController.chat);

module.exports = router;
