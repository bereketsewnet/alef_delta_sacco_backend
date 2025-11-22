INSERT INTO loan_products (product_code, name, interest_rate, interest_type, min_term_months, max_term_months, penalty_rate)
VALUES
('SAV_STANDARD', 'Standard Loan', 12.50, 'FLAT', 6, 36, 1.50),
('DEV_GROWTH', 'Growth Loan', 16.00, 'DECLINING', 12, 48, 2.00)
ON DUPLICATE KEY UPDATE name = VALUES(name), interest_rate = VALUES(interest_rate), interest_type = VALUES(interest_type);

INSERT INTO members (member_id, membership_no, first_name, middle_name, last_name, phone_primary, email, gender, marital_status, address_subcity, address_woreda, address_house_no, member_type, monthly_income, tin_number, status, profile_photo_url, id_card_url, password_hash)
VALUES
('11111111-1111-1111-1111-111111111111', 'MEM-0001', 'Lulit', 'A', 'Bekele', '+251900000001', 'lulit@example.com', 'FEMALE', 'MARRIED', 'Bole', '04', '123', 'GOV_EMP', 25000, 'TIN-001', 'ACTIVE', NULL, NULL, '$2b$12$phrmZ5sWIrp8hqoXCMaKOOpZykdbSEyVoZ6IcmxzpfSrPR3O.Xt6S'),
('22222222-2222-2222-2222-222222222222', 'MEM-0002', 'Samuel', NULL, 'Kebede', '+251900000002', 'samuel@example.com', 'MALE', 'SINGLE', 'Yeka', '05', '456', 'SME', 40000, 'TIN-002', 'ACTIVE', NULL, NULL, '$2b$12$phrmZ5sWIrp8hqoXCMaKOOpZykdbSEyVoZ6IcmxzpfSrPR3O.Xt6S')
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), monthly_income = VALUES(monthly_income);

INSERT INTO accounts (account_id, member_id, product_code, balance, lien_amount, currency, status, version)
VALUES
('acc-1111-aaaa-bbbb-ccccdddd0001', '11111111-1111-1111-1111-111111111111', 'SAVINGS', 15000.00, 0.00, 'ETB', 'ACTIVE', 1),
('acc-2222-aaaa-bbbb-ccccdddd0002', '22222222-2222-2222-2222-222222222222', 'SAVINGS', 23000.00, 0.00, 'ETB', 'ACTIVE', 1)
ON DUPLICATE KEY UPDATE balance = VALUES(balance);

INSERT INTO users (user_id, username, password_hash, role, email, phone, status)
VALUES
('33333333-3333-3333-3333-333333333333', 'teller.one', '$2b$12$phrmZ5sWIrp8hqoXCMaKOOpZykdbSEyVoZ6IcmxzpfSrPR3O.Xt6S', 'TELLER', 'teller1@sacco.local', '+251911111111', 'ACTIVE'),
('44444444-4444-4444-4444-444444444444', 'credit.officer', '$2b$12$phrmZ5sWIrp8hqoXCMaKOOpZykdbSEyVoZ6IcmxzpfSrPR3O.Xt6S', 'CREDIT_OFFICER', 'credit@sacco.local', '+251922222222', 'ACTIVE')
ON DUPLICATE KEY UPDATE email = VALUES(email);

