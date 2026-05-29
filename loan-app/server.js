import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import loanRoutes from './routes/loans.js';
import investmentRoutes from './routes/investments.js';
import adminRoutes from './routes/admin.js';
import profileRoutes from './routes/profile.js';
import kycRoutes from './routes/kyc.js';
import transactionRoutes from './routes/transactions.js';
import cardRoutes from './routes/cards.js';

// Import middleware
import { errorHandler } from './middleware/validation.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cards', cardRoutes);

// HTML Routes
const htmlFiles = [
  { path: '/', file: 'home.html' },
  { path: '/home', file: 'home.html' },
  { path: '/login', file: 'login.html' },
  { path: '/register', file: 'register.html' },
  { path: '/dashboard', file: 'dashboard.html' },
  { path: '/admin-dashboard', file: 'admin_dashboard.html' },
  { path: '/manage-loans', file: 'manage_loans.html' },
  { path: '/apply-loan', file: 'submit_loans.html' },
  { path: '/loan-history', file: 'loan_history.html' },
  { path: '/loan-approved', file: 'loan_approved.html' },
  { path: '/loan-pending', file: 'loan_pending.html' },
  { path: '/loan-review', file: 'loan_review.html' },
  { path: '/investments', file: 'investment_plan.html' },
  { path: '/investment-dashboard', file: 'investment_dashboard.html' },
  { path: '/investment-create', file: 'investment_create.html' },
  { path: '/investment-detail', file: 'investment_detail.html' },
  { path: '/profile', file: 'profile.html' },
  { path: '/kyc', file: 'kyc.html' },
  { path: '/apply-card', file: 'application_for_credit_card.html' },
  { path: '/card-list', file: 'card_list.html' },
  { path: '/transactions', file: 'transaction.html' },
  { path: '/transaction-detail', file: 'transaction_detail.html' },
  { path: '/withdrawal', file: 'withdrawal.html' },
  { path: '/bank-transfer', file: 'bank_transfer.html' },
  { path: '/about', file: 'about.html' },
  { path: '/contact', file: 'contact.html' },
  { path: '/blog', file: 'blog.html' },
  { path: '/services', file: 'service.html' },
  { path: '/rates', file: 'rates.html' },
  { path: '/team', file: 'team.html' },
  { path: '/testimonial', file: 'testimonial.html' },
  { path: '/location', file: 'location.html' },
  { path: '/privacy', file: 'privacy.html' },
  { path: '/security', file: 'security.html' },
  { path: '/savings', file: 'saving.html' },
  { path: '/checking', file: 'checking.html' },
  { path: '/lending', file: 'lending.html' },
  { path: '/crypto', file: 'crypto.html' },
  { path: '/paypal', file: 'paypal.html' },
  { path: '/cashapp', file: 'cashapp.html' },
  { path: '/linking', file: 'linking_page.html' },
  { path: '/tac', file: 'tac.html' },
  { path: '/vat', file: 'vat.html' },
  { path: '/imf', file: 'imf.html' },
  { path: '/pending', file: 'pending.html' },
  { path: '/account-upgrade', file: 'account_upgrade.html' },
  { path: '/schedule', file: 'schedule.html' },
  { path: '/quote', file: 'quote.html' },
  { path: '/feature', file: 'feature.html' },
  { path: '/price', file: 'price.html' },
  { path: '/detail', file: 'detail.html' }
];

htmlFiles.forEach(route => {
  app.get(route.path, (req, res) => {
    const filePath = path.join(__dirname, 'public', route.file);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend available at http://localhost:${PORT}`);
  console.log(`🛠️  Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

export default app;
