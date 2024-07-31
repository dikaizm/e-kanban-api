import { eq } from 'drizzle-orm';

import { db } from '../../db';
import { ApiErr } from '../../utils/api-error';
import { NewPart, Part } from './part.models';
import { partSchema } from '../../models/part.model';

interface PartService {
  getParts: () => Promise<Part[]>;
  getPartById: (id: number) => Promise<Part>;
  createPart: (data: NewPart) => Promise<number>;
  updatePart: (id: number, data: NewPart) => Promise<void>;
  deletePart: (id: number) => Promise<void>;
}

/**
 * Returns parts from the database
 *
 * @returns Promise<Part[]>
 */
async function getParts(): Promise<Part[]> {
  try {
    const result = await db.select().from(partSchema);

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Returns a part by its ID
 *
 * @param {number} id - Part ID
 * @returns Promise<Part>
 */
async function getPartById(id: number): Promise<Part> {
  try {
    const result = await db.select().from(partSchema).where(eq(partSchema.id, id)).limit(1);

    if (result.length === 0) {
      throw ApiErr('Part is not exist', 404);
    }

    return result[0];
  } catch (error) {
    throw error;
  }
}

/**
 * Inserts a new part into the database
 *
 * @param {NewPart} data - New part data
 * @returns Promise<number>
 */
async function createPart(data: NewPart): Promise<number> {
  try {
    const [resultSet] = await db.insert(partSchema).values(data);

    if (resultSet.affectedRows === 0) {
      throw ApiErr('Failed to create part', 500);
    }

    return resultSet.insertId;
  } catch (error) {
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
async function updatePart(id: number, data: NewPart): Promise<void> {
  try {
    const [resultSet] = await db.update(partSchema).set(data).where(eq(partSchema.id, id));

    if (resultSet.affectedRows === 0) {
      throw ApiErr('Failed to update part', 500);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Deletes a part from the database
 *
 * @param {number} id - Part ID
 * @returns Promise<void>
 */
async function deletePart(id: number): Promise<void> {
  try {
    const [resultSet] = await db.delete(partSchema).where(eq(partSchema.id, id));

    if (resultSet.affectedRows === 0) {
      throw ApiErr('Failed to delete part', 500);
    }
  } catch (error) {
    throw error;
  }
}

export default {
  getParts,
  getPartById,
  createPart,
  updatePart,
  deletePart,
} satisfies PartService;
