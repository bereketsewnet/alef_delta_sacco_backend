-- Create loan repayment tracking system
-- Tracks all loan payments, penalties, and balance updates

CREATE TABLE IF NOT EXISTS loan_repayments (
  repayment_id CHAR(36) PRIMARY KEY,
  loan_id CHAR(36) NOT NULL,
  member_id CHAR(36) NOT NULL,
  payment_date DATE NOT NULL,
  amount_paid DECIMAL(18,2) NOT NULL,
  principal_paid DECIMAL(18,2) NOT NULL DEFAULT 0,
  interest_paid DECIMAL(18,2) NOT NULL DEFAULT 0,
  penalty_paid DECIMAL(18,2) NOT NULL DEFAULT 0,
  balance_before DECIMAL(18,2) NOT NULL,
  balance_after DECIMAL(18,2) NOT NULL,
  payment_method ENUM('CASH','BANK_TRANSFER','MOBILE_MONEY','CHECK') DEFAULT 'CASH',
  receipt_no VARCHAR(100) NULL,
  receipt_photo_url VARCHAR(255) NULL,
  notes TEXT NULL,
  performed_by CHAR(36) NOT NULL,
  idempotency_key VARCHAR(100) NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_repayment_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id),
  CONSTRAINT fk_repayment_member FOREIGN KEY (member_id) REFERENCES members(member_id),
  CONSTRAINT fk_repayment_user FOREIGN KEY (performed_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- Add loan balance tracking fields to loan_applications
ALTER TABLE loan_applications
ADD COLUMN outstanding_balance DECIMAL(18,2) NULL AFTER approved_amount,
ADD COLUMN total_paid DECIMAL(18,2) DEFAULT 0 AFTER outstanding_balance,
ADD COLUMN total_penalty DECIMAL(18,2) DEFAULT 0 AFTER total_paid,
ADD COLUMN last_payment_date DATE NULL AFTER next_payment_date,
ADD COLUMN payments_made INT DEFAULT 0 AFTER last_payment_date,
ADD COLUMN is_fully_paid TINYINT(1) DEFAULT 0 AFTER payments_made;

-- Add indexes for performance
CREATE INDEX idx_repayments_loan ON loan_repayments(loan_id);
CREATE INDEX idx_repayments_member ON loan_repayments(member_id);
CREATE INDEX idx_repayments_date ON loan_repayments(payment_date);
CREATE INDEX idx_loans_next_payment ON loan_applications(next_payment_date);


