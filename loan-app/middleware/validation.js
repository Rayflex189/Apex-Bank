import { body, validationResult } from 'express-validator';

// Validation rules
export const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').optional().trim().escape(),
  body('lastName').optional().trim().escape(),
  body('phoneNumber').optional().matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number')
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

export const validateLoanApplication = [
  body('amount').isFloat({ min: 100 }).withMessage('Loan amount must be at least 100'),
  body('loanType').isIn(['personal', 'mortgage', 'auto', 'business', 'education', 'emergency', 'payday']),
  body('duration').isInt({ min: 1, max: 360 }).withMessage('Duration must be between 1 and 360 months'),
  body('employmentStatus').optional(),
  body('annualIncome').optional().isFloat({ min: 0 })
];

export const validateTransaction = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('accountNumber').optional(),
  body('description').optional().trim().escape()
];

// Error handler middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
