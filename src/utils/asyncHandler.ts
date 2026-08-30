import { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/** Wraps an async Express handler so a rejected promise reaches the error
 *  middleware instead of crashing the process (Express 4 doesn't catch these). */
export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
