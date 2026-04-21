import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'utl-secret-key';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    (req as any).userId = decoded.userId;
    (req as any).username = decoded.username;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}