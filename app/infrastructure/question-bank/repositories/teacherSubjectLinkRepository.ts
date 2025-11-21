import { Op, Transaction } from 'sequelize';

import { TeacherSubjectAssignments } from '../../../domains/user/domain/ports/ITeacherSubjectLinkRepository';
import { ITeacherSubjectLinkRepository } from '../../../domains/user/domain/ports/ITeacherSubjectLinkRepository';
import { BaseRepository } from '../../../shared/domain/base_repository';
import Subject from '../models/Subject';
import TeacherSubject from '../models/TeacherSubject';

type SubjectPlain = { id: string; name: string; leadTeacherId?: string | null };
type TeacherSubjectPlain = { teacherId: string; subjectId: string };
type TeacherSubjectCreate = { teacherId: string; subjectId: string };
type TeacherSubjectUpdate = Record<string, never>;

export class TeacherSubjectLinkRepository
    extends BaseRepository<
        TeacherSubject,
        TeacherSubjectPlain,
        TeacherSubjectCreate,
        TeacherSubjectUpdate
    >
    implements ITeacherSubjectLinkRepository
{
    constructor(defaultTx?: Transaction) {
        super(
            TeacherSubject,
            (row) => row.get({ plain: true }) as TeacherSubjectPlain,
            (dto) => dto,
            () => ({}),
            defaultTx,
        );
    }

    static withTx(tx: Transaction) {
        return new TeacherSubjectLinkRepository(tx);
    }

    private emptyAssignments(): TeacherSubjectAssignments {
        return {
            leadSubjectIds: [],
            leadSubjectNames: [],
            teachingSubjectIds: [],
            teachingSubjectNames: [],
        };
    }

    async findMissingSubjectIds(subjectIds: string[], tx?: Transaction): Promise<string[]> {
        const uniqueIds = Array.from(new Set(subjectIds));
        if (uniqueIds.length === 0) return [];

        const rows = await Subject.findAll({
            where: { id: { [Op.in]: uniqueIds } },
            attributes: ['id'],
            transaction: this.effTx(tx),
        });
        const found = new Set(rows.map((row) => row.getDataValue('id') as string));
        return uniqueIds.filter((id) => !found.has(id));
    }

    async syncTeachingSubjects(
        teacherId: string,
        subjectIds: string[],
        tx?: Transaction,
    ): Promise<void> {
        const transaction = this.effTx(tx);
        const rows = await TeacherSubject.findAll({
            where: { teacherId },
            transaction,
        });
        const currentIds = new Set(
            rows.map((row) => (row.get({ plain: true }) as TeacherSubjectPlain).subjectId),
        );
        const desiredIds = new Set(subjectIds);

        const toRemove = [...currentIds].filter((id) => !desiredIds.has(id));
        if (toRemove.length > 0) {
            await TeacherSubject.destroy({
                where: { teacherId, subjectId: toRemove },
                transaction,
            });
        }

        const toAdd = [...desiredIds].filter((id) => !currentIds.has(id));
        if (toAdd.length > 0) {
            await TeacherSubject.bulkCreate(
                toAdd.map((subjectId) => ({ teacherId, subjectId })),
                {
                    ignoreDuplicates: true,
                    transaction,
                },
            );
        }
    }

    async syncLeadSubjects(
        teacherId: string,
        subjectIds: string[],
        tx?: Transaction,
    ): Promise<void> {
        const transaction = this.effTx(tx);
        const uniqueIds = Array.from(new Set(subjectIds));

        const cleanupWhere =
            uniqueIds.length > 0
                ? { leadTeacherId: teacherId, id: { [Op.notIn]: uniqueIds } }
                : { leadTeacherId: teacherId };

        await Subject.update({ leadTeacherId: null }, { where: cleanupWhere, transaction });

        if (uniqueIds.length > 0) {
            await Subject.update(
                { leadTeacherId: teacherId },
                { where: { id: { [Op.in]: uniqueIds } }, transaction },
            );
        }
    }

    async getAssignments(teacherId: string, tx?: Transaction): Promise<TeacherSubjectAssignments> {
        const map = await this.getAssignmentsForTeachers([teacherId], tx);
        return map.get(teacherId) ?? this.emptyAssignments();
    }

    async getAssignmentsForTeachers(
        teacherIds: string[],
        tx?: Transaction,
    ): Promise<Map<string, TeacherSubjectAssignments>> {
        const result = new Map<string, TeacherSubjectAssignments>();
        teacherIds.forEach((id) => result.set(id, this.emptyAssignments()));
        if (teacherIds.length === 0) return result;

        const transaction = this.effTx(tx);

        const leadSubjects = await Subject.findAll({
            where: { leadTeacherId: { [Op.in]: teacherIds } },
            attributes: ['id', 'name', 'leadTeacherId'],
            transaction,
        });
        for (const leadSubject of leadSubjects) {
            const plain = leadSubject.get({ plain: true }) as SubjectPlain;
            if (!plain.leadTeacherId) continue;
            const entry = result.get(plain.leadTeacherId) ?? this.emptyAssignments();
            if (!result.has(plain.leadTeacherId)) {
                result.set(plain.leadTeacherId, entry);
            }
            entry.leadSubjectIds.push(plain.id);
            entry.leadSubjectNames.push(plain.name);
        }

        const teachingRows = await TeacherSubject.findAll({
            where: { teacherId: { [Op.in]: teacherIds } },
            transaction,
        });
        const subjectIds = Array.from(
            new Set(
                teachingRows.map(
                    (row) => (row.get({ plain: true }) as TeacherSubjectPlain).subjectId,
                ),
            ),
        );
        const subjectNameMap = new Map<string, string>();
        if (subjectIds.length > 0) {
            const subjects = await Subject.findAll({
                where: { id: { [Op.in]: subjectIds } },
                attributes: ['id', 'name'],
                transaction,
            });
            for (const subject of subjects) {
                const plain = subject.get({ plain: true }) as SubjectPlain;
                subjectNameMap.set(plain.id, plain.name);
            }
        }

        for (const row of teachingRows) {
            const plain = row.get({ plain: true }) as TeacherSubjectPlain;
            const entry = result.get(plain.teacherId) ?? this.emptyAssignments();
            if (!result.has(plain.teacherId)) {
                result.set(plain.teacherId, entry);
            }
            entry.teachingSubjectIds.push(plain.subjectId);
            const subjectName = subjectNameMap.get(plain.subjectId);
            if (subjectName) {
                entry.teachingSubjectNames.push(subjectName);
            }
        }

        return result;
    }
}
