"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatHttpLoggerResponse = void 0;
const sensitiveInfoExcluder_1 = require("./sensitiveInfoExcluder");
const formatHttpLoggerResponse = (req, res, responseBody, requestStartTime) => {
    const requestDuration = Date.now() - requestStartTime;
    const requestDurationInSeconds = `${requestDuration / 1000}s`; // ms to s
    return {
        request: {
            headers: req.headers,
            host: req.headers.host,
            baseUrl: req.baseUrl,
            url: req.url,
            method: req.method,
            body: req.body,
            params: req?.params,
            query: req?.query,
        },
        response: {
            headers: res.getHeaders(),
            statusCode: res.statusCode,
            requestDurationInSeconds,
            body: sensitiveInfoExcluder_1.excludeSensitiveInfoInData(responseBody),
        },
    };
};
exports.formatHttpLoggerResponse = formatHttpLoggerResponse;
