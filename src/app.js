import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import routes from './api/routes.js';
import config from './core/config.js';
import errorHandler from './core/middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: '*',
    exposedHeaders: ['Idempotency-Key']
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.isProd ? 'combined' : 'dev'));

const uploadsPath = config.uploads.root;
app.use('/uploads', express.static(path.resolve(uploadsPath)));

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth', authLimiter);
app.use('/api', routes);

app.use(errorHandler);

export default app;

