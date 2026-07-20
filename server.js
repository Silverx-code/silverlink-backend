const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const initSockets = require('./sockets/chat');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const companyRoutes = require('./routes/companyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const coordinatorRoutes = require('./routes/coordinatorRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const locationRoutes = require('./routes/locationRoutes');

const app = express();

// ---- Core middleware ----
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (curl, mobile apps, server-to-server) and any configured origin
    if (!origin || config.clientUrls.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (config.env !== 'test') app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));

// General API rate limit
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Tighter limit on registration endpoints — first line of defense against bot signups
// until a proper CAPTCHA provider is wired in.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many registration attempts. Please try again later.' },
});
app.use('/api/auth/register', registerLimiter);

// ---- Health check ----
app.get('/health', (req, res) => res.json({ status: 'ok', env: config.env }));

// ---- API routes ----
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coordinators', coordinatorRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/locations', locationRoutes);

// ---- 404 + error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

// Wrap in a plain HTTP server so Socket.io can share the same port
const httpServer = http.createServer(app);
initSockets(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Silver Link API (HTTP + WebSocket) running on port ${config.port} [${config.env}]`);
});

module.exports = app;
