"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQR = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
// With async/await
const generateQR = async (text) => {
    try {
        const qrCode = await qrcode_1.default.toDataURL(text);
        return qrCode;
    }
    catch (err) {
        console.error(err);
        return err;
    }
};
exports.generateQR = generateQR;
//# sourceMappingURL=qr-code.js.map