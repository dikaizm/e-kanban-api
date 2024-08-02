"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verify_token_1 = __importDefault(require("../../middlewares/verify-token"));
const kanban_handler_1 = __importDefault(require("./kanban.handler"));
const router = express_1.default.Router();
// GET /api/v1/kanban/:id
router.get('/:id', verify_token_1.default, kanban_handler_1.default.getKanbanById);
// PUT /api/v1/kanban/confirm
router.put('/confirm', verify_token_1.default, kanban_handler_1.default.updateKanbanStatus);
exports.default = router;
//# sourceMappingURL=kanban.routes.js.map