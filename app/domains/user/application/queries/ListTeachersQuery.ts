import { BaseQuery } from "../../../../shared/domain/base_use_case";
import { TeacherService } from "../../domain/services/teacherService";
import { ListTeachers, ListTeachersResponse, listTeachersResponseSchema } from "../../schemas/teacherSchema";

export class ListTeachersQuery extends BaseQuery<ListTeachers, ListTeachersResponse> {
  constructor(private readonly service: TeacherService) {
    super();
  }

  protected async executeBusinessLogic(input: ListTeachers): Promise<ListTeachersResponse> {
    const response = await this.service.paginate(input);
    return listTeachersResponseSchema.parse(response);
  }
}
