"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_response_1 = __importDefault(require("../../utils/api-response"));
const progress_track_service_1 = __importDefault(require("./progress-track.service"));
const db_1 = require("../../db");
const part_model_1 = require("../../models/part.model");
const order_model_1 = require("../../models/order.model");
const drizzle_orm_1 = require("drizzle-orm");
async function getProgressTrack(req, res, next) {
    try {
        const progressData = {
            assemblyLine: 0,
            assemblyStore: 0,
            fabrication: 0,
        };
        // Get assembly line data
        // Get assembly store data
        progressData.assemblyStore = await progress_track_service_1.default.getAssemblyStoreProgress();
        // Get fabrication data
        progressData.fabrication = await progress_track_service_1.default.getFabricationProgress();
        res.json(api_response_1.default.success('Progress track data', progressData));
    }
    catch (error) {
        next(error);
    }
}
async function getProductionProgress(req, res, next) {
    try {
        // Get shop floors data in progress
        const selectedColumn = { partName: part_model_1.partSchema.partName, partNumber: part_model_1.partSchema.partNumber, station: part_model_1.partShopFloorSchema.station };
        const shopFloors = await db_1.db.select(selectedColumn).from(part_model_1.partShopFloorSchema).innerJoin(part_model_1.partSchema, (0, drizzle_orm_1.eq)(part_model_1.partSchema.id, part_model_1.partShopFloorSchema.partId)).where((0, drizzle_orm_1.eq)(part_model_1.partShopFloorSchema.status, 'in_progress')).orderBy((0, drizzle_orm_1.desc)(part_model_1.partShopFloorSchema.createdAt));
        res.json(api_response_1.default.success('Production progress data', shopFloors));
    }
    catch (error) {
        next(error);
    }
}
async function getDelayOntime(req, res, next) {
    try {
        const shopFloors = await db_1.db.select().from(part_model_1.partShopFloorSchema).where((0, drizzle_orm_1.eq)(part_model_1.partShopFloorSchema.status, 'finish'));
        if (shopFloors.length === 0) {
            res.json(api_response_1.default.success('Production progress is empty', null));
            return;
        }
        // Collect order ids from shop floors
        const orderIds = shopFloors.map((shopFloor) => shopFloor.orderId);
        // Get order fabrication quantity
        const orderFabrications = await db_1.db.select().from(order_model_1.orderFabricationSchema).where((0, drizzle_orm_1.inArray)(order_model_1.orderFabricationSchema.orderId, orderIds));
        // Get order fabrication quantity
        const totalQuantity = orderFabrications.reduce((acc, order) => acc + order.quantity, 0);
        // Add time remaining and quantity to shop floors
        const processedShopFloors = shopFloors.map((shopFloorData) => {
            const planFinish = shopFloorData.planFinish ? new Date(shopFloorData.planFinish).getTime() : null;
            const actualFinish = shopFloorData.actualFinish ? new Date(shopFloorData.actualFinish).getTime() : null;
            let timeRemaining = null;
            if (planFinish && actualFinish) {
                timeRemaining = planFinish - actualFinish;
            }
            const quantity = orderFabrications.find((order) => order.orderId === shopFloorData.orderId)?.quantity || 0;
            return { ...shopFloorData, timeRemaining, quantity };
        });
        // Count quantity that has time remaining negative
        const delayQuantity = processedShopFloors.filter((shopFloor) => shopFloor.timeRemaining < 0).reduce((acc, shopFloor) => acc + shopFloor.quantity, 0);
        // Count quantity that has time remaining positive
        const ontimeQuantity = processedShopFloors.filter((shopFloor) => shopFloor.timeRemaining >= 0).reduce((acc, shopFloor) => acc + shopFloor.quantity, 0);
        res.json(api_response_1.default.success('Delay ontime data', { delayQuantity, ontimeQuantity, totalQuantity }));
    }
    catch (error) {
        next(error);
    }
}
exports.default = {
    getProgressTrack,
    getProductionProgress,
    getDelayOntime,
};
//# sourceMappingURL=stats.handler.js.map