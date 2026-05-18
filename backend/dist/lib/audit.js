"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const logAudit = async (userId, action, entityId, entityType, details) => {
    try {
        await prisma_1.default.auditLog.create({
            data: {
                userId,
                action,
                entityId,
                entityType,
                details,
            },
        });
    }
    catch (error) {
        console.error('Failed to log audit:', error);
    }
};
exports.logAudit = logAudit;
