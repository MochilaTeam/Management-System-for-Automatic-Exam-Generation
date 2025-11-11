import { Op, WhereOptions, OrderItem, Attributes } from "sequelize";
import {
  type ListSubjectsCriteria,
  type SubjectFilters,
} from "../../../domains/question-bank/domain/ports/ISubjectRepository";
import {
  subjectCreateSchema,
  subjectUpdateSchema,
  subjectReadSchema,
  type SubjectCreate,
  type SubjectUpdate,
  type SubjectRead,
} from "../../../domains/question-bank/schemas/subjectSchema";
import type { Subject } from "../models";

export const SubjectMapper = {
  toRead(row: Subject): SubjectRead {
    const p = row.get({ plain: true }) as {
      id: string; name: string; program: string; leadTeacherId: string | null;
    };
    return subjectReadSchema.parse({
      id: p.id,
      name: p.name,
      program: p.program,
      leadTeacherId: p.leadTeacherId ?? null,
    });
  },

  toCreateAttrs(dto: SubjectCreate): Record<string, unknown> {
    const s = subjectCreateSchema.parse(dto);
    const attrs: Record<string, unknown> = { name: s.name, program: s.program };
    // si viene definido (null o uuid), lo pasamos tal cual; si no viene, la columna usará default null
    if (s.leadTeacherId !== undefined) attrs.leadTeacherId = s.leadTeacherId;
    return attrs;
  },

  toUpdateAttrs(dto: SubjectUpdate): Record<string, unknown> {
    const s = subjectUpdateSchema.parse(dto);
    const attrs: Record<string, unknown> = {};
    if (s.name !== undefined) attrs.name = s.name;
    if (s.program !== undefined) attrs.program = s.program;
    return attrs;
  },

  toWhereFromFilters(filters?: SubjectFilters): WhereOptions<Attributes<Subject>> {
  const where: WhereOptions<Attributes<Subject>> = {};
  if (!filters) return where;

  if (filters.name) where.name = filters.name;
  if (filters.program) where.program = filters.program;          // 👈 nuevo
  if (filters.leadTeacherId) where.leadTeacherId = filters.leadTeacherId;

  if (filters.q) {
    const like = `%${filters.q}%`;
    Object.assign(where, {
      [Op.or]: [{ name: { [Op.like]: like } }, { program: { [Op.like]: like } }],
    });
  }
  return where;
},

toOptions(criteria: ListSubjectsCriteria) {
  const where = this.toWhereFromFilters(criteria.filters);
  const limit = criteria.limit ?? 20;
  const offset = criteria.offset ?? 0;

  const order: OrderItem[] = [];
  if (criteria.sort) {
    const dir = (criteria.sort.dir ?? 'asc').toUpperCase() as 'ASC' | 'DESC';
    order.push([criteria.sort.field, dir]);
  }

  return { where, order, limit, offset };
},
};
