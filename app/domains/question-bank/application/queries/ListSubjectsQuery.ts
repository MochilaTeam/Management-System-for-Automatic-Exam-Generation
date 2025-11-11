import { PaginatedSchema } from "../../../../shared/domain/base_response";
import { BaseQuery } from "../../../../shared/domain/base_use_case";
import { SubjectService } from "../../domain/services/subjectService";
import { ListSubjects, SubjectDetail } from "../../schemas/subjectSchema";

export class ListSubjectsQuery extends BaseQuery<ListSubjects, PaginatedSchema<SubjectDetail>> {
  constructor(private readonly serv: SubjectService) { super(); }

  protected async executeBusinessLogic(input: ListSubjects): Promise<PaginatedSchema<SubjectDetail>> {
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;
    // 👇 usamos paginateDetail en vez de paginate
    const { list, total } = await this.serv.paginateDetail(input);
    return new PaginatedSchema(list, { limit, offset, total });
  }
}
