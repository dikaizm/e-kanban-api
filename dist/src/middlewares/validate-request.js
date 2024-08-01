"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const api_error_1 = require("../utils/api-error");
function validateRequest(validators) {
    return async (req, res, next) => {
        try {
            if (validators.params) {
                req.params = await validators.params.parseAsync(req.params);
            }
            if (validators.body) {
                req.body = await validators.body.parseAsync(req.body);
            }
            if (validators.query) {
                req.query = await validators.query.parseAsync(req.query);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(422);
                if (error.errors[0].message == 'Required') {
                    error = (0, api_error_1.ApiErr)(`Field '${error.issues[0].path[0]}' is ${error.issues[0].message.toLowerCase()}`, 422);
                }
                else {
                    error = (0, api_error_1.ApiErr)(error.errors[0].message, 422);
                }
            }
            next(error);
        }
    };
}
exports.default = validateRequest;
//# sourceMappingURL=validate-request.js.map