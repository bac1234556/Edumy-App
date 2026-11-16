-- Correct the BCrypt fixture for the documented local/demo password Admin@123456.
-- Preserve all accounts whose credentials have already been customized.
UPDATE users
SET password_hash = '$2a$12$avGlOhhv7Wbbuj8ZO1JjV.Nw.eji7nCGs0EWtyxj1zAj8naWSP416'
WHERE email = 'admin@edumy.vn'
  AND role = 'ADMIN'
  AND password_hash = '$2a$12$tuKF7t9/2TSLLDLAqz5SJeuBWRthVPt6kWpHLJ6nItFRuTG.T0.PO';
