import type { RequestHandler } from "express";
import type { z } from "zod";

export function validate(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    if ("body" in parsed) req.body = parsed.body;
    if ("params" in parsed) req.params = parsed.params;
    if ("query" in parsed) req.query = parsed.query;
    next();
  };
}
