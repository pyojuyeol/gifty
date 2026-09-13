const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// 포트원(아임포트) 웹훅은 PG사 서버가 직접 호출하므로 JWT 인증을 걸지 않는다.
// 대신 실제 운영에서는 포트원이 보내는 서명(signature) 검증이 필요하다 (여기선 생략, TODO로 표시).
router.post('/portone', webhookController.portoneWebhook);

module.exports = router;
