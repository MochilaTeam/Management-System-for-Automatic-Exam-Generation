"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseInterceptor = void 0;
const dependencies_1 = require("../dependencies/dependencies");
const formatHttpLoggerResponse_1 = require("../logging/helpers/formatHttpLoggerResponse");
const responseInterceptor = (req, res, next) => {
    const logger = dependencies_1.get_logger();
    const requestStartTime = Date.now();
    const originalSend = res.send;
    let responseSent = false;
    res.send = function (body) {
        if (!responseSent) {
            if (res.statusCode < 400) {
                logger.httpLogger.info('Request processed successfully', formatHttpLoggerResponse_1.formatHttpLoggerResponse(req, res, body, requestStartTime));
            }
            else {
                logger.httpLogger.error(body.message, formatHttpLoggerResponse_1.formatHttpLoggerResponse(req, res, body, requestStartTime));
            }
            responseSent = true;
        }
        return originalSend.call(this, body);
    };
    next();
};
exports.responseInterceptor = responseInterceptor;
//TODO: Crear middlewares de autenticacion, autorizacion
