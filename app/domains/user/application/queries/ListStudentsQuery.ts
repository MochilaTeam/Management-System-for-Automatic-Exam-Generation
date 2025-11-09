import { BaseQuery } from "../../../../shared/domain/base_use_case";
import { StudentService } from "../../domain/services/studentService";
import {ListStudents,ListStudentsResponse,listStudentsResponseSchema} from "../../schemas/studentSchema";

export class ListStudentsQuery extends BaseQuery<ListStudents, ListStudentsResponse> {
  constructor(private readonly service: StudentService) {
    super();
  }

  protected async executeBusinessLogic(input: ListStudents): Promise<ListStudentsResponse> {
    const response = await this.service.paginate(input);
    return listStudentsResponseSchema.parse(response);
  }
}
