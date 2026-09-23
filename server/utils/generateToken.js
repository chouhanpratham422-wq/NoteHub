import jwt from 'jsonwebtoken';

export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'notehub_default_secret_key_change_in_production',
    {
      expiresIn: '30d',
    }
  );
};
