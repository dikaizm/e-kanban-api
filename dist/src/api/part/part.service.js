"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const api_error_1 = require("../../utils/api-error");
const part_model_1 = require("../../models/part.model");
/**
 * Returns parts from the database
 *
 * @returns Promise<Part[]>
 */
async function getParts() {
    try {
        const result = await db_1.db.select().from(part_model_1.partSchema);
        return result;
    }
    catch (error) {
        throw error;
    }
}
/**
 * Returns a part by its ID
 *
 * @param {number} id - Part ID
 * @returns Promise<Part>
 */
async function getPartById(id) {
    try {
        const result = await db_1.db.select().from(part_model_1.partSchema).where((0, drizzle_orm_1.eq)(part_model_1.partSchema.id, id)).limit(1);
        if (result.length === 0) {
            throw (0, api_error_1.ApiErr)('Part is not exist', 404);
        }
        return result[0];
    }
    catch (error) {
        throw error;
    }
}
/**
 * Inserts a new part into the database
 *
 * @param {NewPart} data - New part data
 * @returns Promise<number>
 */
async function createPart(data) {
    try {
        const [resultSet] = await db_1.db.insert(part_model_1.partSchema).values(data);
        if (resultSet.affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to create part', 500);
        }
        return resultSet.insertId;
    }
    catch (error) {
        throw error;
    }
}
/**
 * Updates a part in the database
 *
 * @param {number} id - Part ID
 * @param {NewPart} data - New part data
 * @returns Promise<void>
 */
async function updatePart(id, data) {
    try {
        const [resultSet] = await db_1.db.update(part_model_1.partSchema).set(data).where((0, drizzle_orm_1.eq)(part_model_1.partSchema.id, id));
        if (resultSet.affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to update part', 500);
        }
    }
    catch (error) {
        throw error;
    }
}
/**
 * Deletes a part from the database
 *
 * @param {number} id - Part ID
 * @returns Promise<void>
 */
async function deletePart(id) {
    try {
        const [resultSet] = await db_1.db.delete(part_model_1.partSchema).where((0, drizzle_orm_1.eq)(part_model_1.partSchema.id, id));
        if (resultSet.affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to delete part', 500);
        }
    }
    catch (error) {
        throw error;
    }
}
exports.default = {
    getParts,
    getPartById,
    createPart,
    updatePart,
    deletePart,
};
//# sourceMappingURL=part.service.js.map