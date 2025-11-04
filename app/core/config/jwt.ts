import 'dotenv/config';
import type { StringValue } from 'ms';
import { z } from 'zod';

const JwtEnvSchema = z.object({
    JWT_ISSUER: z.string().min(1),
    JWT_AUDIENCE: z.string().min(1),
    JWT_EXPIRES_IN: z.string().min(1), // "15m", "1h", "7d"
    ACCESS_SECRET: z.string().min(32),
});

export type JwtConfig = {
    accessSecret: string;
    issuer: string;
    audience: string;
    expiresIn: StringValue | number;
};

let cached: JwtConfig | null = null;

export function get_jwt_config(): JwtConfig {
    if (cached) return cached;

    const parsed = JwtEnvSchema.safeParse(process.env);
    if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        throw new Error(`JWT config inválida: ${msg}`);
    }

    const { JWT_ISSUER, JWT_AUDIENCE, JWT_EXPIRES_IN, ACCESS_SECRET } = parsed.data;

    cached = {
        accessSecret: ACCESS_SECRET,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        expiresIn: JWT_EXPIRES_IN as StringValue,
    };
    return cached;
}
