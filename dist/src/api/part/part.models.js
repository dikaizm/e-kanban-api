"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartId = exports.NewPart = void 0;
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = __importDefault(require("zod"));
const part_model_1 = require("../../models/part.model");
exports.NewPart = (0, drizzle_zod_1.createInsertSchema)(part_model_1.partSchema, {
    partNumber: zod_1.default.string().min(1).max(256),
    partName: zod_1.default.string().min(1).max(256),
    quantity: zod_1.default.number().int().min(0).default(0),
    quantityReq: zod_1.default.number().int().min(0).default(0),
});
exports.PartId = zod_1.default.object({
    id: zod_1.default
        .string()
        .min(1)
        .refine((id) => !isNaN(parseInt(id)), {
        message: 'Invalid part id',
    }),
});
//# sourceMappingURL=part.models.js.map