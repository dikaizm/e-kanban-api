"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_response_1 = __importDefault(require("../../utils/api-response"));
const user_service_1 = __importDefault(require("./user.service"));
const auth_1 = __importDefault(require("../../config/auth"));
async function login(req, res, next) {
    try {
        const data = req.body;
        const authRes = await user_service_1.default.login(data);
        res.json(api_response_1.default.success('Login success', authRes));
    }
    catch (error) {
        next(error);
    }
}
async function register(req, res, next) {
    try {
        const data = req.body;
        const { email, password, confirmPassword, registerKey } = data;
        if (password !== confirmPassword) {
            res.status(400).json(api_response_1.default.error('Password and confirm password must be the same'));
            return;
        }
        if (registerKey != auth_1.default.secret) {
            res.status(400).json(api_response_1.default.error('Invalid register key'));
            return;
        }
        const newUser = {
            name: data.name,
            email,
            role: data.role,
            password,
        };
        await user_service_1.default.register(newUser);
        const loginRes = await user_service_1.default.login({ email, password });
        const authRes = {
            token: loginRes.token,
            user: {
                name: loginRes.user.name,
                email: loginRes.user.email,
                role: loginRes.user.role,
            },
        };
        res.status(201).json(api_response_1.default.success('Register success', authRes));
    }
    catch (error) {
        next(error);
    }
}
async function me(req, res) {
    res.send(api_response_1.default.success('You are authorized!', req.body.user));
}
exports.default = {
    login,
    register,
    me,
};
//# sourceMappingURL=user.handler.js.map