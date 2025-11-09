import { ModelStatic } from "sequelize";
import { BaseRepository } from "../../../shared/domain/base_repository";

import { Teacher } from "../models";
import { TeacherMapper } from "../mappers/teacherMapper";
import { ITeacherRepository, ListTeachersCriteria, TeacherFilters } from "../../../domains/user/domain/ports/ITeacherRepository";
import { TeacherCreate, TeacherRead, TeacherUpdate } from "../../../domains/user/schemas/teacherSchema";

export class TeacherRepository
  extends BaseRepository<Teacher, TeacherRead, TeacherCreate, TeacherUpdate>
  implements ITeacherRepository
{
    constructor(model: ModelStatic<Teacher>) {
        super(
        model,
        TeacherMapper.toRead,         
        TeacherMapper.toCreateAttrs,  
        TeacherMapper.toUpdateAttrs,  
        );
    }   

    async list(criteria: ListTeachersCriteria): Promise<TeacherRead[]> {
    const opts = TeacherMapper.toOptions(criteria);   
    return this.listByOptions(opts);           
    }

    async paginate(criteria: ListTeachersCriteria): Promise<{ items: TeacherRead[]; total: number }> {
    const opts = TeacherMapper.toOptions(criteria);
    return this.paginateByOptions(opts);
    }

    async existsBy(filters: TeacherFilters): Promise<boolean> {
    const where = TeacherMapper.toWhereFromFilters(filters);
    return this.exists(where);
    }

}
