import { ModelStatic, Transaction } from "sequelize";
import {
  ISubjectRepository,
  type ListSubjectsCriteria,
} from "../../../domains/question-bank/domain/ports/ISubjectRepository";
import {
  type SubjectRead,
  type SubjectCreate,
  type SubjectUpdate,
  subjectDetailSchema,
  type SubjectDetail,
  subTopicDetailSchema,
  topicDetailSchema,
} from "../../../domains/question-bank/schemas/subjectSchema";
import { BaseRepository } from "../../../shared/domain/base_repository";
import { SubjectMapper } from "../mappers/subjectMapper";
import {
  Subject as SubjectModel,
  Topic as TopicModel,
  SubTopic as SubTopicModel,
  SubjectTopic as SubjectTopicModel
} from "../models";
import { Teacher } from "../../user/models";

export class SubjectRepository
  extends BaseRepository<SubjectModel, SubjectRead, SubjectCreate, SubjectUpdate>
  implements ISubjectRepository {

  constructor(model: ModelStatic<SubjectModel>, defaultTx?: Transaction) {
    super(
      model,
      SubjectMapper.toRead.bind(SubjectMapper),
      SubjectMapper.toCreateAttrs.bind(SubjectMapper),
      SubjectMapper.toUpdateAttrs.bind(SubjectMapper),
      defaultTx
    );
  }

  static withTx(model: ModelStatic<SubjectModel>, tx: Transaction) {
    return new SubjectRepository(model, tx);
  }

  // --- helpers privados ---

  private async buildDetailForSubject(
    subj: { id: string; name: string; program: string; leadTeacherId: string | null },
    tx?: Transaction
  ): Promise<SubjectDetail> {
    // líder
    let leaderName = "";
    if (subj.leadTeacherId) {
      const teacher = await Teacher.findByPk(subj.leadTeacherId, { transaction: this.effTx(tx) });
      if (teacher) {
        const t = teacher.get({ plain: true }) as { name?: string; firstName?: string; lastName?: string };
        leaderName = t.name ?? [t.firstName, t.lastName].filter(Boolean).join(" ") ?? "";
      }
    }

    // topics asociados por la tabla puente
    const subjectTopics = await SubjectTopicModel.findAll({
      where: { subjectId: subj.id },
      transaction: this.effTx(tx),
    });
    const topicIds = subjectTopics.map((st: any) => st.get("topicId") as string);
    const topics = topicIds.length
      ? await TopicModel.findAll({ where: { id: topicIds }, transaction: this.effTx(tx) })
      : [];

    const topicDetails = [];
    for (const topic of topics) {
      const t = topic.get({ plain: true }) as { id: string; title: string };
      const subs = await SubTopicModel.findAll({
        where: { topicId: t.id },
        transaction: this.effTx(tx),
      });

      const subDetails = subs.map((s) => {
        const sp = s.get({ plain: true }) as { id: string; name: string };
        return subTopicDetailSchema.parse({
          subtopic_id: sp.id,
          subtopic_name: sp.name,
        });
      });

      const td = topicDetailSchema.parse({
        topic_id: t.id,
        topic_name: t.title,
        subject_id: subj.id,
        subject_name: subj.name,
        subtopics_amount: subDetails.length,
        subtopics: subDetails,
      });
      topicDetails.push(td);
    }

    return subjectDetailSchema.parse({
      subject_id: subj.id,
      subject_name: subj.name,
      subject_program: subj.program,
      subject_leader_name: leaderName,
      topics_amount: topicDetails.length,
      topics: topicDetails,
    });
  }

  // --- métodos públicos ya existentes (paginate/list/exists/delete) se mantienen ---

  async paginate(criteria: ListSubjectsCriteria, tx?: Transaction) {
    const opts = SubjectMapper.toOptions(criteria);
    return this.paginateByOptions(
      { where: opts.where, order: opts.order, limit: opts.limit, offset: opts.offset },
      tx
    );
  }

  async list(criteria: ListSubjectsCriteria, tx?: Transaction) {
    const opts = SubjectMapper.toOptions(criteria);
    return this.listByOptions(
      { where: opts.where, order: opts.order, limit: opts.limit, offset: opts.offset },
      tx
    );
  }

  async existsBy(filters: Parameters<typeof SubjectMapper.toWhereFromFilters>[0], tx?: Transaction) {
    const where = SubjectMapper.toWhereFromFilters(filters);
    return super.exists(where, tx);
  }

  async deleteById(id: string, tx?: Transaction): Promise<boolean> {
    const deleted = await this.model.destroy({ where: { id }, transaction: this.effTx(tx) });
    return deleted > 0;
  }

  // detalle por id (ya lo teníamos)
  async get_detail_by_id(id: string, tx?: Transaction): Promise<SubjectDetail | null> {
    try {
      const subjectRow = await this.model.findByPk(id, { transaction: this.effTx(tx) });
      if (!subjectRow) return null;
      const subj = subjectRow.get({ plain: true }) as {
        id: string; name: string; program: string; leadTeacherId: string | null;
      };
      return this.buildDetailForSubject(subj, tx);
    } catch (e) {
      return this.raiseError(e, this.model.name);
    }
  }

  // 👇 NUEVO: paginación con detalle
  async paginateDetail(criteria: ListSubjectsCriteria, tx?: Transaction): Promise<{ items: SubjectDetail[]; total: number }> {
    try {
      // 1) paginamos subjects “simples” para respetar limit/offset/total
      const { items: subjects, total } = await this.paginate(criteria, tx);

      // 2) para cada subject, construimos su detail
      const details: SubjectDetail[] = [];
      for (const s of subjects) {
        // s viene validado por mapper → lo casteamos a los campos que necesitamos
        const subj = { id: s.id, name: s.name, program: s.program, leadTeacherId: (s as any).leadTeacherId ?? null };
        const detail = await this.buildDetailForSubject(subj, tx);
        details.push(detail);
      }
      return { items: details, total };
    } catch (e) {
      return this.raiseError(e, this.model.name);
    }
  }
}
