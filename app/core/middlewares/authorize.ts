import type { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../../shared/enums/httpStatusEnum";
import type { Roles } from "../../shared/enums/rolesEnum";


function forbid(
    res: Response, 
    message: string = "Forbidden", 
    httpStatus: HttpStatus = HttpStatus.FORBIDDEN
) {
  return res.status(httpStatus).json({ message });
}

//Requiere que el usuario tenga AL MENOS uno de los roles indicados.
export function requireRoles(...allowed: Roles[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return forbid(res, "Unauthenticated", HttpStatus.UNAUTHORIZED);
    const userRoles = user.roles ?? [];

    const hasAny = userRoles.some(r => allowed.includes(r));
    if (!hasAny) return forbid(res);

    return next();
  };
}   


//Requiere que el usuario tenga TODOS los roles indicados.
export function requireAllRoles(...required: Roles[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return forbid(res, "Unauthenticated", HttpStatus.UNAUTHORIZED);
    const userRoles = user.roles ?? [];

    const hasAll = required.every(r => userRoles.includes(r));
    if (!hasAll) return forbid(res);

    return next();
  };
}
