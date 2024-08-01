"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const user_routes_1 = __importDefault(require("./user/user.routes"));
const asm_line_routes_1 = __importDefault(require("./assembly-line/asm-line.routes"));
const asm_store_routes_1 = __importDefault(require("./assembly-store/asm-store.routes"));
const asm_fabrication_routes_1 = __importDefault(require("./fabrication/asm-fabrication.routes"));
const router = express_1.default.Router();
router.get('/', (req, res) => {
    res.send(api_response_1.default.success('The API is live!', null));
});
router.use(user_routes_1.default);
// router.use('/parts', partRoutes);
// router.use('/orders', orderRoutes);
router.use('/assembly-line', asm_line_routes_1.default);
router.use('/assembly-store', asm_store_routes_1.default);
router.use('/fabrication', asm_fabrication_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map