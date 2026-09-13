const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/my-gift-cards', authenticate, orderController.myGiftCards);
router.post('/use', authenticate, orderController.useGiftCard);
router.get('/transactions', authenticate, orderController.myTransactions);

module.exports = router;
