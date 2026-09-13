const express = require('express');
const router = express.Router();
const giftController = require('../controllers/gift.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/', authenticate, giftController.sendGift);
router.get('/received', authenticate, giftController.myReceivedGifts);
router.get('/sent', authenticate, giftController.mySentGifts);

module.exports = router;
