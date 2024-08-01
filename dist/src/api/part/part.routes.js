"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validate_request_1 = __importDefault(require("../../middlewares/validate-request"));
const verify_token_1 = __importDefault(require("../../middlewares/verify-token"));
const part_handler_1 = __importDefault(require("./part.handler"));
const part_models_1 = require("./part.models");
const router = express_1.default.Router();
// GET /api/v1/parts
router.get('/', verify_token_1.default, part_handler_1.default.getAllParts);
// POST /api/v1/parts
router.post('/', [verify_token_1.default, (0, validate_request_1.default)({ body: part_models_1.NewPart })], part_handler_1.default.createPart);
// GET /api/v1/parts/:id
router.get('/:id', [verify_token_1.default, (0, validate_request_1.default)({ params: part_models_1.PartId })], part_handler_1.default.getPartById);
// PATCH /api/v1/parts/:id
router.patch('/:id', [verify_token_1.default, (0, validate_request_1.default)({ params: part_models_1.PartId, body: part_models_1.NewPart })], part_handler_1.default.updatePart);
// DELETE /api/v1/parts/:id
router.delete('/:id', [verify_token_1.default, (0, validate_request_1.default)({ params: part_models_1.PartId })], part_handler_1.default.deletePart);
exports.default = router;
//# sourceMappingURL=part.routes.js.map