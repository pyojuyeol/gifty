const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/gift-cards', require('./giftcard.routes'));
router.use('/gifts', require('./gift.routes'));
router.use('/orders', require('./order.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/webhooks', require('./webhook.routes'));

module.exports = router;
