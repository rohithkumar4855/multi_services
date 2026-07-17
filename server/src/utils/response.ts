import { Response } from 'express';

export const sendResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data: any = {}
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
