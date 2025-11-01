import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getAccessToken } from "./helpers/getAccessToken";
import { HttpStatus } from "../../shared/enums/httpStatusEnum";
import { Roles } from "../../shared/enums/rolesEnum";


const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_ISSUER = process.env.JWT_ISSUER!;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE!;

interface ExtendedPayloadWithRolesField extends jwt.JwtPayload { roles?: Roles[]}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getAccessToken(req);
    if (!token) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Missing token" });
    }

    const decoded = jwt.verify(token, ACCESS_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as ExtendedPayloadWithRolesField;

    if (!decoded || typeof decoded !== "object" || !decoded.sub) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Invalid token payload" });
    }

    req.user = {
      id: String(decoded.sub),
      roles: Array.isArray(decoded.roles) ? decoded.roles : [],
    };

    return next();
  } catch (err: any) {
    let message: string = "Unauthorized"

    if (err?.name === "TokenExpiredError") message = "Token expired"
    if (err?.name === "JsonWebTokenError") message = "Invalid token"

    return res.status(HttpStatus.UNAUTHORIZED).json({ message: message });
  }
}
