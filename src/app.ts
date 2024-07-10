import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import api from './api';
import errorHandler from './middlewares/error-handler';
import notFound from './middlewares/not-found';

dotenv.config();

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', api);
console.log('[server]: Router loaded');

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
