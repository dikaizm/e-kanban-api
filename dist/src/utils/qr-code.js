"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStationName = exports.generateQR = void 0;
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
const getStationName = (id) => {
    switch (id) {
        case 1:
            return 'Assembly Line';
        case 2:
            return 'Assembly Store';
        case 3:
            return 'Fabrication';
        default:
            return 'Unknown';
    }
};
exports.getStationName = getStationName;
//# sourceMappingURL=qr-code.js.map