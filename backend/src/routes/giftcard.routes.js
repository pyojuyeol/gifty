const express = require('express');
const router = express.Router();
const giftcardController = require('../controllers/giftcard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', giftcardController.listGiftCards);
router.post('/purchase', authenticate, giftcardController.purchaseGiftCard);

module.exports = router;
