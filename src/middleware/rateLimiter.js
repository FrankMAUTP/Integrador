const rateLimit = require('express-rate-limit');

const IS_TEST = process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_TEST ? 9999 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
});

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_TEST ? 9999 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
});

const dbLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: IS_TEST ? 9999 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera un momento.' },
});

module.exports = { authLimiter, emailLimiter, dbLimiter };
