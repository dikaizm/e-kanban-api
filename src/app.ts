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

const allowlist = ['https://ekanban-manufacture.vercel.app', 'http://localhost:5163'];
const corsOptionsDelegate = function (req: any, callback: any) {
  let corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

app.use(morgan('dev'));
app.use(helmet());
app.use(cors(corsOptionsDelegate));
app.use(express.json());

// Routes
app.use('/api/v1', api);
console.log('[server]: Router loaded');

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
