// // Handler de lectura: valida, llama al servicio y devuelve BaseResponse
// import { GetUserByIdQuery } from "../GetUserByIdQuery";
// import { UserService } from "../../services/UserService";
// import { BaseResponse } from "../../../../shared/domain/base_response";

// export class GetUserByIdHandler {
//   constructor(private svc: UserService) {}

//   async execute(q: GetUserByIdQuery) {
//     if (!q.userId) throw new Error("userId requerido");
//     const user = await this.svc.getUserById(q.userId);
//     if (!user) return BaseResponse.fail("Usuario no encontrado", "USER_NOT_FOUND");
//     return BaseResponse.success(user);
//   }
// }
