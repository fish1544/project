declare global {
  namespace Express {
    interface Request {
      appUserId?: string;
    }
  }
}

export {};
