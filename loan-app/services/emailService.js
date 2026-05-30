import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send verification email
export const sendVerificationEmail = async (to, token) => {
  const verificationUrl = `${process.env.APP_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0a4b7a;">Welcome to ${process.env.APP_NAME}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0a4b7a; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `
  };
  
  return await transporter.sendMail(mailOptions);
};

// Send loan approval email
export const sendLoanApprovalEmail = async (to, loan) => {
  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Loan Application Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0a4b7a;">Congratulations! Your Loan Has Been Approved</h2>
        <p>Dear ${loan.user?.firstName || 'Customer'},</p>
        <p>We are pleased to inform you that your loan application has been approved.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Loan Details:</h3>
          <p><strong>Loan Amount:</strong> $${loan.amount.toLocaleString()}</p>
          <p><strong>Interest Rate:</strong> ${loan.interestRate}%</p>
          <p><strong>Processing Fee:</strong> $${loan.processingFee.toLocaleString()}</p>
          <p><strong>Total Due:</strong> $${loan.totalAmountDue.toLocaleString()}</p>
          <p><strong>Monthly Payment:</strong> $${loan.monthlyPayment.toLocaleString()}</p>
          <p><strong>Duration:</strong> ${loan.duration} months</p>
        </div>
        <p>Funds will be disbursed within 2-3 business days.</p>
        <p>Thank you for banking with us!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">${process.env.APP_NAME} - Securing Your Financial Future</p>
      </div>
    `
  };
  
  return await transporter.sendMail(mailOptions);
};

// Send loan rejection email
export const sendLoanRejectionEmail = async (to, loan, reason) => {
  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Loan Application Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c83a3a;">Loan Application Status Update</h2>
        <p>Dear ${loan.user?.firstName || 'Customer'},</p>
        <p>We regret to inform you that your loan application has not been approved at this time.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Reason:</strong> ${reason || 'Your application did not meet our current lending criteria.'}</p>
          <p><strong>Amount Requested:</strong> $${loan.amount.toLocaleString()}</p>
        </div>
        <p>You may reapply after 30 days or contact our support team for more information.</p>
        <p>Thank you for considering ${process.env.APP_NAME}.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">${process.env.APP_NAME} - Securing Your Financial Future</p>
      </div>
    `
  };
  
  return await transporter.sendMail(mailOptions);
};

// Send KYC verification email
export const sendKYCEmail = async (to, status) => {
  const statusMessage = status === 'verified' 
    ? 'Your KYC has been successfully verified!' 
    : 'Your KYC submission is being reviewed.';
    
  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `KYC ${status === 'verified' ? 'Verification Complete' : 'Update'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0a4b7a;">KYC Status Update</h2>
        <p>${statusMessage}</p>
        <p>If you have any questions, please contact our support team.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">${process.env.APP_NAME} - Securing Your Financial Future</p>
      </div>
    `
  };
  
  return await transporter.sendMail(mailOptions);
};

// Send transaction alert
export const sendTransactionAlert = async (to, amount, type, balance) => {
  const typeSymbol = type === 'credit' ? '+' : '-';
  const typeColor = type === 'credit' ? '#1e9c50' : '#c83a3a';
  
  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `Transaction Alert: ${type === 'credit' ? 'Credit' : 'Debit'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0a4b7a;">Transaction Alert</h2>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount:</strong> <span style="color: ${typeColor};">${typeSymbol}$${amount.toLocaleString()}</span></p>
          <p><strong>Transaction Type:</strong> ${type === 'credit' ? 'Credit' : 'Debit'}</p>
          <p><strong>New Balance:</strong> $${balance.toLocaleString()}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>If you did not authorize this transaction, please contact us immediately.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">${process.env.APP_NAME} - Securing Your Financial Future</p>
      </div>
    `
  };
  
  return await transporter.sendMail(mailOptions);
};
