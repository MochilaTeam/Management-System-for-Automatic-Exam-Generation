import { Attributes, WhereOptions, OrderItem } from 'sequelize';

import {
    ListQuestionTypesCriteria,
    QuestionTypeFilters,
} from '../../../domains/question-bank/domain/ports/IQuestionTypeRepository';
import {
    questionTypeCreateSchema,
    questionTypeUpdateSchema,
    questionTypeReadSchema,
    QuestionTypeCreate,
    QuestionTypeUpdate,
    QuestionTypeRead,
} from '../../../domains/question-bank/schemas/questionTypeSchema';
import type QuestionType from '../models/QuestionType';

export const QuestionTypeMapper = {
    toRead(row: QuestionType): QuestionTypeRead {
        const p = row.get({ plain: true }) as {
            id: string;
            name: string;
        };

        return questionTypeReadSchema.parse({
            id: p.id,
            name: p.name,
        });
    },

    toCreateAttrs(dto: QuestionTypeCreate): Record<string, unknown> {
        const safe = questionTypeCreateSchema.parse(dto);
        return {
            name: safe.name,
        };
    },

    toUpdateAttrs(dto: QuestionTypeUpdate): Record<string, unknown> {
        const safe = questionTypeUpdateSchema.parse(dto);
        const attrs: Record<string, unknown> = {};
        if (safe.name !== undefined) attrs.name = safe.name;
        return attrs;
    },

    toWhereFromFilters(filters?: QuestionTypeFilters): WhereOptions<Attributes<QuestionType>> {
        const where: WhereOptions<Attributes<QuestionType>> = {};
        if (!filters) return where;

        if (filters.name !== undefined) {
            where.name = filters.name;
        }

        return where;
    },

    toOptions(criteria: ListQuestionTypesCriteria): {
        where: WhereOptions;
        order: OrderItem[];
        limit: number;
        offset: number;
    } {
        const where = this.toWhereFromFilters(criteria.filters);
        const limit = criteria.limit ?? 20;
        const offset = criteria.offset ?? 0;

        // Por ahora no tenemos sort, pero dejamos el array vacío
        const order: OrderItem[] = [];

        return { where, order, limit, offset };
    },
};
