import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

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

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allows inline scripts for your HTML templates
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(express.static('public'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loan_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cards', cardRoutes);

// HTML Routes (serving your 38 templates)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin_dashboard.html'));
});

app.get('/manage-loans', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manage_loans.html'));
});

app.get('/apply-loan', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'submit_loans.html'));
});

app.get('/loan-history', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'loan_history.html'));
});

app.get('/loan-approved/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'loan_approved.html'));
});

app.get('/investments', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'investment_plan.html'));
});

app.get('/investment-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'investment_dashboard.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/kyc', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kyc.html'));
});

app.get('/apply-card', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'application_for_credit_card.html'));
});

app.get('/card-list', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'card_list.html'));
});

app.get('/transactions', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'transaction.html'));
});

app.get('/withdrawal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'withdrawal.html'));
});

app.get('/bank-transfer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bank_transfer.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'service.html'));
});

app.get('/rates', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rates.html'));
});

app.get('/team', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'team.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend available at http://localhost:${PORT}`);
});
