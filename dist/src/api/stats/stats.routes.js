"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stats_handler_1 = __importDefault(require("./stats.handler"));
const router = express_1.default.Router();
router.get('/', (req, res) => {
    res.send('Stats routes');
});
// GET /api/v1/stats/progress-track
router.get('/progress-track', stats_handler_1.default.getProgressTrack);
// GET /api/v1/stats/delay-ontime
router.get('/delay-ontime', stats_handler_1.default.getDelayOntime);
exports.default = router;
//# sourceMappingURL=stats.routes.js.map