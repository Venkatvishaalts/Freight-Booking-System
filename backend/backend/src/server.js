require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/database');

const app = express();

// ============================================================================
// CREATE HTTP SERVER (REQUIRED FOR SOCKET.IO)
// ============================================================================
const server = http.createServer(app);

// ============================================================================
// SOCKET.IO SETUP (🔥 FINAL FIX)
// ============================================================================
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
      'https://freight-booking-system.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'], // 🔥 IMPORTANT FIX
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

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
      'https://freight-booking-system.vercel.app'
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
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================================
// DATABASE
// ============================================================================
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => {
    console.error('❌ DB error:', err);
    process.exit(1);
  });

// ============================================================================
// ROUTES
// ============================================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date(),
    database: 'connected'
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews'));

// ============================================================================
// ERROR HANDLING
// ============================================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ============================================================================
// START SERVER
// ============================================================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});