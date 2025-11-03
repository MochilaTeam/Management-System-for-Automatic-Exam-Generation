import { CreateUserCommand } from "../CreateUserCommand";
import { UserService } from "../../services/UserService";

// Si tienes EventBus, lo inyectas y publicas un "UserCreated" al final.
// Aquí lo dejo opcional para mantenerlo simple.
export class CreateUserHandler {
  constructor(private svc: UserService/*, private eventBus?: IEventBus */) {}

  async execute(cmd: CreateUserCommand) {
    // Validación mínima (la validación "seria" la haces con Zod en el controlador)
    if (!cmd.name || !cmd.email) throw new Error("name y email requeridos");

    const created = await this.svc.createUser(cmd);

    // await this.eventBus?.publish({ type: "UserCreated", payload: { userId: created.id } });
    return BaseResponse.success(created);
  }
}
