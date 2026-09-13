const logger = require('../utils/logger');

// 커스텀 비즈니스 에러. 상태 코드와 함께 던지면 errorHandler가 일관되게 처리한다.
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function notFoundHandler(req, res, next) {
  res.status(404).json({ message: `경로를 찾을 수 없습니다: ${req.originalUrl}` });
}

// Sequelize의 검증/제약조건 에러를 사람이 읽을 수 있는 메시지로 변환
function formatSequelizeError(err) {
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const fieldMessages = err.errors.map((e) => {
      if (e.validatorKey === 'isEmail') return '올바른 이메일 형식이 아닙니다.';
      if (e.type === 'unique violation' || e.validatorKey === 'not_unique') {
        const fieldNames = { email: '이메일', phone: '휴대폰 번호', kakaoId: '카카오 계정' };
        return `이미 사용 중인 ${fieldNames[e.path] || e.path}입니다.`;
      }
      return e.message;
    });
    return fieldMessages.join(' ');
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  // Sequelize 검증/유니크 제약 에러는 400으로, 사람이 읽을 수 있는 메시지로 변환
  const sequelizeMessage = formatSequelizeError(err);
  if (sequelizeMessage) {
    return res.status(400).json({ message: sequelizeMessage });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.isOperational ? err.message : '서버 내부 오류가 발생했습니다.',
  });
}

module.exports = { AppError, notFoundHandler, errorHandler };
