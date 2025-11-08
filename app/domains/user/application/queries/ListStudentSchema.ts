import { BaseQuery } from "../../../../shared/domain/base_use_case";
import { UserService } from "../../domain/services/userService";
import { ListStudents, ListStudentsResponse, listStudentsResponseSchema } from "../../schemas/studentSchema";

export class ListStudentQuery extends BaseQuery<ListStudents, ListStudentsResponse> {
  constructor(private readonly serv: UserService){ super();}

  protected async executeBusinessLogic(input: ListStudents): Promise<ListStudentsResponse>{
    const criteria ={
      offset: input.offset,
      limit: input.limit,
      filters: {
        role: input.role,
        active: input.active,
        q: input.filter,
        email: input.email
      }
    }
    const {items, total} = await this.serv.repo.paginate(criteria);

    const response = {
      data: items,
      meta: { limit: input.limit, offset: input.offset, total },
    };

    return listStudentsResponseSchema.parse(response);
  }
}
