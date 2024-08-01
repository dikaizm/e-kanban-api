"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const drizzle_orm_1 = require("drizzle-orm");
const jsonwebtoken_1 = require("jsonwebtoken");
const auth_1 = __importDefault(require("../../config/auth"));
const db_1 = require("../../db");
const api_error_1 = require("../../utils/api-error");
const user_models_1 = require("./user.models");
/**
 * Logs in a user
 *
 * @param {LoginData} data - User login data
 * @returns Promise<string>
 */
async function login(data) {
    try {
        const { email, password, remember } = data;
        const users = await db_1.db.select().from(user_models_1.users).where((0, drizzle_orm_1.eq)(user_models_1.users.email, email)).limit(1);
        if (users.length === 0) {
            throw (0, api_error_1.ApiErr)('These credentials do not match our records', 404);
        }
        const user = users[0];
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            throw (0, api_error_1.ApiErr)('These credentials do not match our records', 404);
        }
        const token = (0, jsonwebtoken_1.sign)({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        }, auth_1.default.secret, {
            expiresIn: remember ? '30d' : '3d',
        });
        const authRes = {
            token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
        return authRes;
    }
    catch (error) {
        throw error;
    }
}
/**
 * Doesn't do anything, yet
 *
 * @returns void
 */
async function logout() {
    console.log('logout');
}
/**
 * Registers a new user
 *
 * @param {NewUser} data
 * @returns Promise<void>
 */
async function register(data) {
    try {
        // Check if user already exists
        const users = await db_1.db.select().from(user_models_1.users).where((0, drizzle_orm_1.eq)(user_models_1.users.email, data.email)).limit(1);
        if (users.length > 0) {
            throw (0, api_error_1.ApiErr)('User already exists', 400);
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        if (!hashedPassword)
            throw Error('Failed to hash password');
        data.password = hashedPassword;
        const result = await db_1.db.insert(user_models_1.users).values(data);
        if (!result) {
            throw (0, api_error_1.ApiErr)('Failed to register');
        }
        console.log('Register success');
    }
    catch (error) {
        throw error;
    }
}
/**
 * Refreshes a user's token
 *
 * @param {UserVerified} user - User data
 * @returns string
 */
function refreshToken(user) {
    try {
        const expireTimeMs = user.exp * 1000;
        const remainingTime = expireTimeMs - Date.now();
        if (remainingTime <= 0) {
            throw (0, api_error_1.ApiErr)('Token expired', 401);
        }
        const newToken = (0, jsonwebtoken_1.sign)({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        }, auth_1.default.secret, {
            expiresIn: '8h',
        });
        return newToken;
    }
    catch (error) {
        throw error;
    }
}
exports.default = {
    login,
    logout,
    register,
    refreshToken,
};
//# sourceMappingURL=user.service.js.map