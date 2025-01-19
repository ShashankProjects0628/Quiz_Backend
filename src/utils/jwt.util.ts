import { sign } from 'jsonwebtoken';

const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const ACCESS_TOKEN_EXPIRY = '60m'; // 15 minutes

export const generateAccessToken = (
  payload: object,
  jwtSecret: string,
): string => {
  return sign(payload, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (
  payload: object,
  jwtSecret: string,
): string => {
  return sign(payload, jwtSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
};
