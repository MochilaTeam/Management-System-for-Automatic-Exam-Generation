// // core/dependencies/dependencies.ts (extracto)
// import { UserRepositorySequelize } from "../../infrastructure/user/repositories/UserRepositorySequelize";
// import { UserReadRepositorySequelize } from "../../infrastructure/user/repositories/UserReadRepositorySequelize";
// import { UserService } from "../../domains/user/application/services/UserService";
// import { CreateUserHandler } from "../../domains/user/application/commands/handlers/CreateUserHandler";
// import { GetUserByIdHandler } from "../../domains/user/application/queries/handlers/GetUserByIdHandler";

// const userWriteRepo = new UserRepositorySequelize();
// const userReadRepo  = new UserReadRepositorySequelize();

// const userService   = new UserService(userWriteRepo, userReadRepo);

// export const container = {
//   createUserHandler: new CreateUserHandler(userService),
//   getUserByIdHandler: new GetUserByIdHandler(userService),
//   // ...otros handlers
// };
