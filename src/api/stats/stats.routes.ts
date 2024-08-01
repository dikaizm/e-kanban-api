import express from 'express';
import handler from './stats.handler';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Stats routes');
});

// GET /api/v1/stats/progress-track
router.get('/progress-track', handler.getProgressTrack);

// GET /api/v1/stats/delay-ontime
router.get('/delay-ontime', handler.getDelayOntime);

export default router;