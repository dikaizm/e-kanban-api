"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_response_1 = __importDefault(require("../../utils/api-response"));
const part_service_1 = __importDefault(require("./part.service"));
async function getAllParts(req, res, next) {
    try {
        const parts = await part_service_1.default.getParts();
        // Check if part quantity is already complete
        let partStatus = 'Not Complete';
        for (const part of parts) {
            if (part.quantity < part.quantityReq) {
                partStatus = 'Not Complete';
                break;
            }
            else {
                partStatus = 'Complete';
            }
        }
        res.send(api_response_1.default.success('Parts retrieved successfully', { partStatus, parts }));
    }
    catch (error) {
        next(error);
    }
}
async function getPartById(req, res, next) {
    try {
        const { id } = req.params;
        const part = await part_service_1.default.getPartById(parseInt(id));
        res.send(api_response_1.default.success('Part retrieved successfully', part));
    }
    catch (error) {
        next(error);
    }
}
async function createPart(req, res, next) {
    try {
        const data = req.body;
        const partId = await part_service_1.default.createPart(data);
        res.send(api_response_1.default.success('Part created successfully', { inserted_id: partId }));
    }
    catch (error) {
        next(error);
    }
}
async function updatePart(req, res, next) {
    try {
        const { id } = req.params;
        const data = req.body;
        await part_service_1.default.updatePart(parseInt(id), data);
        res.send(api_response_1.default.success('Part updated successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function deletePart(req, res, next) {
    try {
        const { id } = req.params;
        await part_service_1.default.deletePart(parseInt(id));
        res.send(api_response_1.default.success('Part deleted successfully', null));
    }
    catch (error) {
        next(error);
    }
}
exports.default = {
    getAllParts,
    getPartById,
    createPart,
    updatePart,
    deletePart,
};
//# sourceMappingURL=part.handler.js.map