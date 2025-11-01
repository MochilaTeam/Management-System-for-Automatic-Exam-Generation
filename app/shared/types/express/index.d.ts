import "express";
import { Roles } from "../../enums/rolesEnum";

// Augmenta el tipo Request de Express
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      roles?: Roles[];
    };
  }
}