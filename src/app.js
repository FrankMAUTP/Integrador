const path    = require('path');
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');

const { blockServerFiles }                    = require('./middleware/security');
const { authLimiter, emailLimiter, dbLimiter } = require('./middleware/rateLimiter');
const authRoutes  = require('./routes/authRoutes');
const dbRoutes    = require('./routes/dbRoutes');
const adminRoutes = require('./routes/adminRoutes');
const excelRoutes = require('./routes/excelRoutes');
const emailRoutes = require('./routes/emailRoutes');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:      ["'self'", "'unsafe-inline'"],
      imgSrc:        ["'self'", "data:", "blob:"],
    },
  },
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '50mb' }));

app.use(blockServerFiles);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth',      authLimiter);
app.use('/api/contact',   emailLimiter);
app.use('/api/send-code', emailLimiter);
app.use('/api/db',        dbLimiter);

app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'))
);

app.use('/api/auth',  authRoutes);
app.use('/api/db',    dbRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api',       excelRoutes);
app.use('/api',       emailRoutes);

module.exports = { app };
