const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('../middlewares/error.middleware');

function issueToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// 하이픈/공백 제거해서 저장 - "010-1234-5678"과 "01012345678"을 같은 번호로 취급
function normalizePhone(phone) {
  return phone ? phone.replace(/[^0-9]/g, '') : phone;
}

async function register(req, res) {
  const { email, password, name } = req.body;
  const phone = normalizePhone(req.body.phone);

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) throw new AppError('이미 가입된 이메일입니다.', 409);

  if (phone) {
    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) throw new AppError('이미 가입된 휴대폰 번호입니다.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, name, phone });

  const token = issueToken(user);
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);

  const token = issueToken(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}

// TODO: 카카오 OAuth 콜백 처리 (kakaoLogin) - code로 access_token 교환 후 사용자 조회/생성
async function kakaoLogin(req, res) {
  throw new AppError('아직 구현되지 않았습니다. 2주차 이후 진행 예정.', 501);
}

module.exports = { register, login, kakaoLogin };
