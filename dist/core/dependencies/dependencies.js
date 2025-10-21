"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_logger = void 0;
const logger_1 = require("../logging/logger");
function get_logger() {
    return new logger_1.SystemLogger();
}
exports.get_logger = get_logger;
