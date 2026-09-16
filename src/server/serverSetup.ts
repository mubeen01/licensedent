import express from 'express';
import { type MiddlewareConfigFn } from 'wasp/server';

// Wasp's default global middleware caps request bodies at Express's default
// (100kb) via plain express.json()/express.urlencoded(). Question import
// (importQuestionsFromText) posts a whole PDF's client-extracted plain text
// as one JSON body -- a multi-page source easily exceeds 100kb, surfacing to
// the admin as a bare, unexplained "Request failed with status code 413."
// Raised to 20mb, comfortably above anything a single PDF's extracted text
// will produce.
export const serverMiddlewareFn: MiddlewareConfigFn = (middlewareConfig) => {
  middlewareConfig.set('express.json', express.json({ limit: '20mb' }));
  middlewareConfig.set('express.urlencoded', express.urlencoded({ limit: '20mb', extended: true }));
  return middlewareConfig;
};
