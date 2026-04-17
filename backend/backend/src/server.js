require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http'); // ✅ NEW
const { Server } = require('socket.io'); // ✅ NEW
const sequelize = require('./config/database');

const app = express();

// ============================================================================
// CREATE HTTP SERVER (IMPORTANT FOR SOCKET.IO)
// ============================================================================
const server = http.createServer(app); // ✅ NEW

// ============================================================================
// SOCKET.IO SETUP
// ============================================================================
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible in controllers
app.set('io', io);

// Socket connection
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Join shipment room
  socket.on('joinShipment', (shipmentId) => {
    socket.join(shipmentId);
    console.log(`📦 Socket ${socket.id} joined shipment ${shipmentId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS must be FIRST
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ];

    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/freight-booking-system.*\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================================
// DATABASE CONNECTION
// ============================================================================
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established');
  })
  .catch(err => {
    console.error('❌ Unable to connect to database:', err);
    process.exit(1);
  });

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date(),
    database: 'connected'
  });
});

// Routes
const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipments');
const bookingRoutes = require('./routes/bookings');
const trackingRoutes = require('./routes/tracking');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');

app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err.stack })
  });
});

// ============================================================================
// START SERVER (IMPORTANT CHANGE HERE)
// ============================================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => { // ✅ CHANGED (app → server)
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;