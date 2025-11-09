import { BaseQuery } from "../../../../shared/domain/base_use_case";
import { RetrieveOneSchema } from "../../../../shared/domain/base_response";
import { NotFoundError } from "../../../../shared/exceptions/domainErrors";
import { TeacherService } from "../../domain/services/teacherService";
import { TeacherIdParams, TeacherRead } from "../../schemas/teacherSchema";

export class GetTeacherByIdQuery extends BaseQuery<TeacherIdParams, RetrieveOneSchema<TeacherRead>> {
  constructor(private readonly service: TeacherService) {
    super();
  }

  protected async executeBusinessLogic(input: TeacherIdParams): Promise<RetrieveOneSchema<TeacherRead>> {
    const teacher = await this.service.getById(input.teacherId);
    if (!teacher) {
      throw new NotFoundError({ message: "TEACHER_NOT_FOUND" });
    }
    return new RetrieveOneSchema(teacher);
  }
}
