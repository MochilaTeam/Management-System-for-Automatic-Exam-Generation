import { Op, Transaction } from 'sequelize';

import { TeacherSubjectAssignments } from '../../../domains/user/domain/ports/ITeacherSubjectLinkRepository';
import { ITeacherSubjectLinkRepository } from '../../../domains/user/domain/ports/ITeacherSubjectLinkRepository';
import { BaseRepository } from '../../../shared/domain/base_repository';
import Subject from '../models/Subject';
import LeaderSubject from '../models/LeaderSubject';
import TeacherSubject from '../models/TeacherSubject';

type SubjectPlain = { id: string; name?: string; leadTeacherId?: string | null };
type LeaderSubjectPlain = { teacherId: string; subjectId: string };
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

    async findSubjectLeaders(
        subjectIds: string[],
        tx?: Transaction,
    ): Promise<Map<string, string>> {
        const leaders = new Map<string, string>();
        const uniqueIds = Array.from(new Set(subjectIds));
        if (uniqueIds.length === 0) return leaders;

        const transaction = this.effTx(tx);

        const leaderRows = await LeaderSubject.findAll({
            where: { subjectId: { [Op.in]: uniqueIds } },
            attributes: ['subjectId', 'teacherId'],
            transaction,
        });
        for (const row of leaderRows) {
            const plain = row.get({ plain: true }) as LeaderSubjectPlain;
            leaders.set(plain.subjectId, plain.teacherId);
        }

        const missingIds = uniqueIds.filter((id) => !leaders.has(id));
        if (missingIds.length > 0) {
            const subjectRows = await Subject.findAll({
                where: {
                    id: { [Op.in]: missingIds },
                    leadTeacherId: { [Op.not]: null },
                },
                attributes: ['id', 'leadTeacherId'],
                transaction,
            });
            for (const subject of subjectRows) {
                const plain = subject.get({ plain: true }) as SubjectPlain;
                if (plain.leadTeacherId) {
                    leaders.set(plain.id, plain.leadTeacherId);
                }
            }
        }

        return leaders;
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
        const desiredIds = Array.from(new Set(subjectIds));
        const desiredSet = new Set(desiredIds);

        const leaderRows = await LeaderSubject.findAll({
            where: { teacherId },
            transaction,
        });
        const leaderTableIds = new Set(
            leaderRows.map((row) => (row.get({ plain: true }) as LeaderSubjectPlain).subjectId),
        );

        const legacyRows = await Subject.findAll({
            where: { leadTeacherId: teacherId },
            attributes: ['id'],
            transaction,
        });
        const currentLeadIds = new Set<string>([
            ...leaderTableIds,
            ...legacyRows.map((row) => row.getDataValue('id') as string),
        ]);

        const toRemove = [...currentLeadIds].filter((id) => !desiredSet.has(id));
        if (toRemove.length > 0) {
            await LeaderSubject.destroy({
                where: { teacherId, subjectId: toRemove },
                transaction,
            });
            await Subject.update(
                { leadTeacherId: null },
                { where: { id: toRemove, leadTeacherId: teacherId }, transaction },
            );
        }

        const toCreate = [...desiredSet].filter((id) => !leaderTableIds.has(id));
        if (toCreate.length > 0) {
            const existingLinks = await LeaderSubject.findAll({
                where: { subjectId: { [Op.in]: toCreate } },
                transaction,
            });
            const existingPlain = existingLinks.map(
                (row) => row.get({ plain: true }) as LeaderSubjectPlain,
            );

            const conflicts = existingPlain
                .filter((plain) => plain.teacherId !== teacherId)
                .map((plain) => plain.subjectId);

            const subjectsToValidate = toCreate.filter(
                (id) => !existingPlain.some((plain) => plain.subjectId === id),
            );
            if (subjectsToValidate.length > 0) {
                const subjectConflicts = await Subject.findAll({
                    where: {
                        id: { [Op.in]: subjectsToValidate },
                        leadTeacherId: { [Op.not]: null, [Op.ne]: teacherId },
                    },
                    attributes: ['id'],
                    transaction,
                });
                conflicts.push(
                    ...subjectConflicts.map((row) => row.getDataValue('id') as string),
                );
            }

            const conflictIds = Array.from(new Set(conflicts));
            if (conflictIds.length > 0) {
                const error = new Error('SUBJECT_ALREADY_HAS_LEADER');
                (error as Error & { details?: unknown }).details = { subjectIds: conflictIds };
                throw error;
            }

            const rowsToInsert = toCreate.filter(
                (id) => !existingPlain.some((plain) => plain.subjectId === id),
            );
            if (rowsToInsert.length > 0) {
                await LeaderSubject.bulkCreate(
                    rowsToInsert.map((subjectId) => ({ teacherId, subjectId })),
                    { ignoreDuplicates: true, transaction },
                );
            }
        }

        if (desiredIds.length > 0) {
            await Subject.update(
                { leadTeacherId: teacherId },
                { where: { id: { [Op.in]: desiredIds } }, transaction },
            );
            await TeacherSubject.bulkCreate(
                desiredIds.map((subjectId) => ({ teacherId, subjectId })),
                { ignoreDuplicates: true, transaction },
            );
        }
    }

    async findTeachersForSubject(subjectId: string, tx?: Transaction): Promise<string[]> {
        if (!subjectId) return [];

        const rows = await TeacherSubject.findAll({
            where: { subjectId },
            attributes: ['teacherId'],
            transaction: this.effTx(tx),
        });
        const teacherIds = rows.map(
            (row) => (row.get({ plain: true }) as TeacherSubjectPlain).teacherId,
        );
        return Array.from(new Set(teacherIds));
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

        const leadSubjectIdsByTeacher = new Map<string, Set<string>>();
        const leadSubjectIds = new Set<string>();
        const subjectNameMap = new Map<string, string>();

        const leadLinks = await LeaderSubject.findAll({
            where: { teacherId: { [Op.in]: teacherIds } },
            attributes: ['teacherId', 'subjectId'],
            transaction,
        });
        for (const row of leadLinks) {
            const plain = row.get({ plain: true }) as LeaderSubjectPlain;
            const subjectSet = leadSubjectIdsByTeacher.get(plain.teacherId) ?? new Set<string>();
            subjectSet.add(plain.subjectId);
            leadSubjectIdsByTeacher.set(plain.teacherId, subjectSet);
            leadSubjectIds.add(plain.subjectId);
        }

        const legacyLeadSubjects = await Subject.findAll({
            where: { leadTeacherId: { [Op.in]: teacherIds } },
            attributes: ['id', 'name', 'leadTeacherId'],
            transaction,
        });
        for (const leadSubject of legacyLeadSubjects) {
            const plain = leadSubject.get({ plain: true }) as SubjectPlain;
            if (!plain.leadTeacherId) continue;
            const subjectSet = leadSubjectIdsByTeacher.get(plain.leadTeacherId) ?? new Set<string>();
            subjectSet.add(plain.id);
            leadSubjectIdsByTeacher.set(plain.leadTeacherId, subjectSet);
            if (plain.name) subjectNameMap.set(plain.id, plain.name);
            leadSubjectIds.add(plain.id);
        }

        const missingNames = Array.from(leadSubjectIds).filter(
            (id) => !subjectNameMap.has(id),
        );
        if (missingNames.length > 0) {
            const subjects = await Subject.findAll({
                where: { id: { [Op.in]: missingNames } },
                attributes: ['id', 'name'],
                transaction,
            });
            for (const subject of subjects) {
                const plain = subject.get({ plain: true }) as SubjectPlain;
                if (plain.name) subjectNameMap.set(plain.id, plain.name);
            }
        }

        for (const [teacherId, subjectSet] of leadSubjectIdsByTeacher.entries()) {
            const entry = result.get(teacherId) ?? this.emptyAssignments();
            if (!result.has(teacherId)) {
                result.set(teacherId, entry);
            }
            for (const subjectId of subjectSet) {
                entry.leadSubjectIds.push(subjectId);
                const name = subjectNameMap.get(subjectId);
                if (name) {
                    entry.leadSubjectNames.push(name);
                }
            }
        }

        const teachingRows = await TeacherSubject.findAll({
            where: { teacherId: { [Op.in]: teacherIds } },
            transaction,
        });
        const teachingSubjectIds = Array.from(
            new Set(
                teachingRows.map(
                    (row) => (row.get({ plain: true }) as TeacherSubjectPlain).subjectId,
                ),
            ),
        );
        const missingTeachingNames = teachingSubjectIds.filter(
            (id) => !subjectNameMap.has(id),
        );
        if (missingTeachingNames.length > 0) {
            const subjects = await Subject.findAll({
                where: { id: { [Op.in]: missingTeachingNames } },
                attributes: ['id', 'name'],
                transaction,
            });
            for (const subject of subjects) {
                const plain = subject.get({ plain: true }) as SubjectPlain;
                if (plain.name) subjectNameMap.set(plain.id, plain.name);
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
