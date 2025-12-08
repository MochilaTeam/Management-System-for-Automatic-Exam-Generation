import swaggerJsdoc from 'swagger-jsdoc';

const roleEnum = ['student', 'teacher', 'admin', 'subject_leader', 'examiner'];

const studentSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', format: 'email', example: 'jane@example.com' },
        role: { type: 'string', enum: roleEnum },
        age: { type: 'integer', example: 21 },
        course: { type: 'integer', example: 3 },
    },
    required: ['id', 'userId', 'name', 'email', 'role', 'age', 'course'],
};

const userSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', format: 'email', example: 'john@example.com' },
        role: { type: 'string', enum: roleEnum },
    },
    required: ['id', 'name', 'email', 'role'],
};

const paginationMetaSchema = {
    type: 'object',
    properties: {
        limit: { type: 'integer', example: 20 },
        offset: { type: 'integer', example: 0 },
        total: { type: 'integer', example: 2 },
    },
    required: ['limit', 'offset', 'total'],
};

const teacherSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Alice Smith' },
        email: { type: 'string', format: 'email', example: 'alice@example.com' },
        role: { type: 'string', enum: roleEnum },
        specialty: { type: 'string', example: 'Bases de datos' },
        hasRoleSubjectLeader: { type: 'boolean' },
        hasRoleExaminer: { type: 'boolean' },
        subjects_ids: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            description: 'Asignaturas lideradas',
        },
        subjects_names: {
            type: 'array',
            items: { type: 'string' },
            description: 'Nombres de las asignaturas lideradas',
        },
        teaching_subjects_ids: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            description: 'Asignaturas impartidas',
        },
        teaching_subjects_names: {
            type: 'array',
            items: { type: 'string' },
            description: 'Nombres de las asignaturas impartidas',
        },
    },
    required: [
        'id',
        'userId',
        'name',
        'email',
        'role',
        'specialty',
        'hasRoleSubjectLeader',
        'hasRoleExaminer',
    ],
};

// ===== QUESTION-BANK (consistentes y sin duplicados) =====
const subjectSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        program: { type: 'string' },
        leadTeacherId: { type: 'string', format: 'uuid', nullable: true },
    },
    required: ['id', 'name', 'program'],
    additionalProperties: false,
};

// Canonizamos a "SubtopicDetail" (camel normal). Evita usar "SubTopicDetail".
const subtopicDetailSchema = {
    type: 'object',
    properties: {
        subtopic_id: { type: 'string', format: 'uuid' },
        subtopic_name: { type: 'string' },
    },
    required: ['subtopic_id', 'subtopic_name'],
    additionalProperties: false,
};

// Referencia compacta de Subject para TopicDetail.subjects[]
const subjectRefSchema = {
    type: 'object',
    properties: {
        subject_id: { type: 'string', format: 'uuid' },
        subject_name: { type: 'string' },
    },
    required: ['subject_id', 'subject_name'],
    additionalProperties: false,
};

// NUEVO TopicDetail correcto (M:N con subjects[])
const topicDetailSchema_correct = {
    type: 'object',
    properties: {
        topic_id: { type: 'string', format: 'uuid' },
        topic_name: { type: 'string' },
        subjects_amount: { type: 'number' },
        subjects: {
            type: 'array',
            items: { $ref: '#/components/schemas/SubjectRef' },
        },
        subtopics_amount: { type: 'number' },
        subtopics: {
            type: 'array',
            items: { $ref: '#/components/schemas/SubtopicDetail' },
        },
    },
    required: [
        'topic_id',
        'topic_name',
        'subjects_amount',
        'subjects',
        'subtopics_amount',
        'subtopics',
    ],
    additionalProperties: false,
};

// SubjectDetail ahora referencia el TopicDetail NUEVO (sin subject_id único).
const subjectDetailSchema = {
    type: 'object',
    properties: {
        subject_id: { type: 'string', format: 'uuid' },
        subject_name: { type: 'string' },
        subject_program: { type: 'string' },
        subject_leader_id: { type: 'string', format: 'uuid', nullable: true },
        subject_leader_name: { type: 'string', description: 'Vacío si no hay líder' },
        topics_amount: { type: 'number' },
        topics: {
            type: 'array',
            items: { $ref: '#/components/schemas/TopicDetail' },
        },
    },
    required: [
        'subject_id',
        'subject_name',
        'subject_program',
        'subject_leader_id',
        'subject_leader_name',
        'topics_amount',
        'topics',
    ],
    additionalProperties: false,
};

// ===== QUESTION-TYPE =====
// No ponemos enum aquí porque depende de tu QuestionTypeEnum en código.
// Lo dejamos como string con descripción clara.
const questionTypeSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        name: {
            type: 'string',
            description: 'Valor del QuestionTypeEnum definido en el dominio',
            example: 'MULTIPLE_CHOICE',
        },
    },
    required: ['id', 'name'],
    additionalProperties: false,
};

const examQuestionPreviewSchema = {
    type: 'object',
    properties: {
        questionId: { type: 'string', format: 'uuid' },
        questionIndex: { type: 'integer', example: 1 },
        questionScore: { type: 'number', example: 5 },
        body: { type: 'string', example: 'Defina qué es la normalización en bases de datos.' },
        difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'], example: 'MEDIUM' },
        questionTypeId: { type: 'string', format: 'uuid' },
        subTopicId: { type: 'string', format: 'uuid', nullable: true },
        topicId: { type: 'string', format: 'uuid', nullable: true },
        options: {
            type: 'array',
            nullable: true,
            items: {
                type: 'object',
                properties: {
                    text: { type: 'string', example: 'Opción A' },
                    isCorrect: { type: 'boolean', example: false },
                },
                required: ['text', 'isCorrect'],
            },
        },
        response: { type: 'string', nullable: true, example: 'Respuesta modelo' },
    },
    required: [
        'questionId',
        'questionIndex',
        'questionScore',
        'body',
        'difficulty',
        'questionTypeId',
    ],
};

const examQuestionLinkSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        examId: { type: 'string', format: 'uuid' },
        questionId: { type: 'string', format: 'uuid' },
        questionIndex: { type: 'integer', example: 1 },
        questionScore: { type: 'number', example: 5 },
    },
    required: ['id', 'examId', 'questionId', 'questionIndex', 'questionScore'],
};

const examBaseSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string', example: 'Parcial 1' },
        subjectId: { type: 'string', format: 'uuid' },
        difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'], example: 'MEDIUM' },
        examStatus: {
            type: 'string',
            enum: ['draft', 'on_review', 'valid', 'invalid', 'published'],
            example: 'draft',
        },
        authorId: { type: 'string', format: 'uuid' },
        validatorId: { type: 'string', format: 'uuid', nullable: true },
        observations: { type: 'string', nullable: true },
        questionCount: { type: 'integer', example: 10 },
        topicProportion: {
            type: 'object',
            additionalProperties: { type: 'number' },
            example: { algebra: 0.4, analitica: 0.6 },
        },
        topicCoverage: {
            type: 'object',
            additionalProperties: true,
            example: { topicIds: ['2f51...', '3ad2...'], minPerTopic: 3 },
        },
        validatedAt: { type: 'string', nullable: true, format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
    required: [
        'id',
        'title',
        'subjectId',
        'difficulty',
        'examStatus',
        'authorId',
        'questionCount',
        'topicProportion',
        'topicCoverage',
        'createdAt',
        'updatedAt',
    ],
};

const createManualExamInputSchema = {
    type: 'object',
    properties: {
        title: { type: 'string', example: 'Parcial 1' },
        subjectId: { type: 'string', format: 'uuid' },
        questions: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    questionId: { type: 'string', format: 'uuid' },
                    questionIndex: { type: 'integer', example: 1 },
                    questionScore: { type: 'number', example: 5 },
                },
                required: ['questionId', 'questionIndex', 'questionScore'],
            },
            example: [
                {
                    questionId: '5f50d4d1-f0ac-4b6e-a40b-0a5c5c849f20',
                    questionIndex: 1,
                    questionScore: 5,
                },
                {
                    questionId: '1c21ac0a-445a-42b7-9b18-8b0979f765c1',
                    questionIndex: 2,
                    questionScore: 5,
                },
            ],
        },
    },
    description:
        'La dificultad, autor y estado se calculan automáticamente; envía solo título, materia y las preguntas a incluir.',
    required: ['title', 'subjectId', 'questions'],
};

const createAutomaticExamInputSchema = {
    type: 'object',
    properties: {
        title: { type: 'string', example: 'Parcial 2' },
        subjectId: { type: 'string', format: 'uuid' },
        questionCount: { type: 'integer', example: 12 },
        questionTypeDistribution: {
            type: 'array',
            description: 'Cantidad de preguntas por tipo (debe sumar la cantidad total)',
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string', format: 'uuid' },
                    count: { type: 'integer', example: 4 },
                },
                required: ['type', 'count'],
            },
            example: [
                { type: '5f50d4d1-f0ac-4b6e-a40b-0a5c5c849f20', count: 4 },
                { type: '1c21ac0a-445a-42b7-9b18-8b0979f765c1', count: 4 },
                { type: '9a9b5e2d-129e-4d6a-826f-f1c4090a3c88', count: 4 },
            ],
        },
        difficultyDistribution: {
            type: 'array',
            description: 'Cantidad de preguntas por nivel de dificultad',
            items: {
                type: 'object',
                properties: {
                    difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] },
                    count: { type: 'integer', example: 4 },
                },
                required: ['difficulty', 'count'],
            },
            example: [
                { difficulty: 'EASY', count: 3 },
                { difficulty: 'MEDIUM', count: 6 },
                { difficulty: 'HARD', count: 3 },
            ],
        },
        topicCoverage: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            description: 'Temas que deben considerarse durante la generación (opcional)',
            example: ['2f51069d-391f-4c5a-9994-3e7b5c7fbb6a'],
        },
        subtopicDistribution: {
            type: 'array',
            description: 'Distribución deseada por subtema (opcional)',
            items: {
                type: 'object',
                properties: {
                    subtopic: { type: 'string', format: 'uuid' },
                    count: { type: 'integer', example: 2 },
                },
                required: ['subtopic', 'count'],
            },
        },
    },
    required: [
        'title',
        'subjectId',
        'questionCount',
        'questionTypeDistribution',
        'difficultyDistribution',
    ],
};

const examDecisionInputSchema = {
    type: 'object',
    properties: {
        comment: {
            type: 'string',
            maxLength: 2000,
            description: 'Comentario del revisor que se guardará en las observaciones del examen.',
            example: 'Revisado. Proceder a publicar.',
        },
    },
    additionalProperties: false,
};

const automaticExamPreviewSchemaDoc = {
    type: 'object',
    properties: {
        title: { type: 'string' },
        subjectId: { type: 'string', format: 'uuid' },
        difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] },
        examStatus: {
            type: 'string',
            enum: ['draft', 'on_review', 'valid', 'invalid', 'published'],
        },
        authorId: { type: 'string', format: 'uuid' },
        validatorId: { type: 'string', format: 'uuid', nullable: true },
        observations: { type: 'string', nullable: true },
        questionCount: { type: 'integer' },
        topicProportion: {
            type: 'object',
            additionalProperties: { type: 'number' },
            example: { algebra: 0.5, analitica: 0.5 },
        },
        topicCoverage: {
            type: 'object',
            additionalProperties: true,
            example: {
                typeCounts: [
                    { questionTypeId: '5f50d...', count: 4 },
                    { questionTypeId: '1c21a...', count: 4 },
                ],
                difficultyCounts: { EASY: 3, MEDIUM: 6, HARD: 3 },
                topicIds: ['2f51...', '3ad2...'],
                subtopicDistribution: [{ subtopicId: '9a9b...', count: 2 }],
            },
        },
        questions: {
            type: 'array',
            items: examQuestionPreviewSchema,
        },
    },
    required: [
        'title',
        'subjectId',
        'difficulty',
        'examStatus',
        'authorId',
        'questionCount',
        'topicProportion',
        'topicCoverage',
        'questions',
    ],
};

const updateExamInputSchema = {
    type: 'object',
    properties: {
        title: { type: 'string' },
        observations: { type: 'string', nullable: true },
        questions: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    questionId: { type: 'string', format: 'uuid' },
                    questionIndex: { type: 'integer' },
                    questionScore: { type: 'number' },
                },
                required: ['questionId', 'questionIndex', 'questionScore'],
            },
            description:
                'Si se envía, sustituye completamente las preguntas del examen; la cantidad y métricas se recalculan.',
        },
    },
    description:
        'Todos los campos son opcionales; si se envía el arreglo de preguntas debe contener la lista completa a persistir. Cualquier actualización devolverá el examen a estado draft automáticamente.',
};

const listExamsResponseSchema = {
    type: 'object',
    properties: {
        data: {
            type: 'array',
            items: examBaseSchema,
        },
        meta: paginationMetaSchema,
    },
    required: ['data', 'meta'],
};

const examDetailResponseSchema = {
    type: 'object',
    properties: {
        data: {
            allOf: [
                examBaseSchema,
                {
                    type: 'object',
                    properties: {
                        questions: {
                            type: 'array',
                            items: examQuestionLinkSchema,
                        },
                    },
                    required: ['questions'],
                },
            ],
        },
    },
    required: ['data'],
};

const automaticExamPreviewResponseSchema = {
    type: 'object',
    properties: {
        data: automaticExamPreviewSchemaDoc,
    },
    required: ['data'],
};

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Management System API',
        version: '1.0.0',
        description: 'API para gestionar usuarios y el banco de preguntas del sistema de exámenes.',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Servidor local' }],
    security: [{ bearerAuth: [] }],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
        schemas: {
            // ===== AUTH / USER / TEACHER / STUDENT (ya existentes) =====
            LoginRequest: {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', minLength: 8, example: 'mypassword123' },
                },
                required: ['email', 'password'],
            },
            LoginResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                        type: 'object',
                        properties: {
                            token: { type: 'string', example: 'eyJhbGciOi...' },
                            user: { $ref: '#/components/schemas/User' },
                        },
                        required: ['token', 'user'],
                    },
                },
                required: ['success', 'message', 'data'],
            },
            Student: studentSchema,
            User: userSchema,
            Teacher: teacherSchema,

            ListStudentsResponse: {
                type: 'object',
                properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Student' } },
                    meta: paginationMetaSchema,
                },
                required: ['data', 'meta'],
            },
            ListUsersResponse: {
                type: 'object',
                properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    meta: paginationMetaSchema,
                },
                required: ['data', 'meta'],
            },
            ListTeachersResponse: {
                type: 'object',
                properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Teacher' } },
                    meta: paginationMetaSchema,
                },
                required: ['data', 'meta'],
            },

            CreateStudentInput: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    age: { type: 'integer' },
                    course: { type: 'integer' },
                },
                required: ['name', 'email', 'password', 'age', 'course'],
            },
            UpdateStudentInput: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: roleEnum },
                    password: { type: 'string', minLength: 8 },
                    age: { type: 'integer' },
                    course: { type: 'integer' },
                },
            },
            CreateTeacherInput: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: roleEnum },
                    password: { type: 'string', minLength: 8 },
                    specialty: { type: 'string' },
                    hasRoleSubjectLeader: { type: 'boolean' },
                    hasRoleExaminer: { type: 'boolean' },
                    subjects_ids: {
                        type: 'array',
                        items: { type: 'string', format: 'uuid' },
                        description: 'Asignaturas donde será líder',
                    },
                    teaching_subjects_ids: {
                        type: 'array',
                        items: { type: 'string', format: 'uuid' },
                        description: 'Asignaturas que impartirá',
                    },
                },
                required: ['name', 'email', 'role', 'password', 'specialty'],
            },
            UpdateTeacherInput: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: roleEnum },
                    password: { type: 'string', minLength: 8 },
                    specialty: { type: 'string' },
                    hasRoleSubjectLeader: { type: 'boolean' },
                    hasRoleExaminer: { type: 'boolean' },
                    subjects_ids: {
                        type: 'array',
                        items: { type: 'string', format: 'uuid' },
                        description: 'Asignaturas donde será líder',
                    },
                    teaching_subjects_ids: {
                        type: 'array',
                        items: { type: 'string', format: 'uuid' },
                        description: 'Asignaturas que impartirá',
                    },
                },
            },
            CreateUserInput: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: roleEnum },
                    password: { type: 'string', minLength: 8 },
                },
                required: ['name', 'email', 'role', 'password'],
            },
            UpdateUserInput: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: roleEnum },
                    password: { type: 'string', minLength: 8 },
                },
            },

            PaginationMeta: paginationMetaSchema,

            // ===== EXAM-APPLICATION =====
            AssignExamToCourseInput: {
                type: 'object',
                required: ['studentIds', 'applicationDate', 'durationMinutes'],
                properties: {
                    studentIds: {
                        type: 'array',
                        minItems: 1,
                        description: 'Lista de IDs de estudiantes a los que se asignará el examen',
                        items: {
                            type: 'string',
                            format: 'uuid',
                        },
                    },
                    applicationDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Fecha y hora en que se aplicará el examen',
                        example: '2025-12-15T10:00:00Z',
                    },
                    durationMinutes: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 480,
                        description: 'Duración del examen en minutos (máximo 8 horas)',
                        example: 90,
                    },
                },
            },
            AssignExamToCourseResponse: {
                type: 'object',
                properties: {
                    examId: { type: 'string', format: 'uuid' },
                    assignedStudentIds: {
                        type: 'array',
                        description: 'IDs de los estudiantes a los que se asignó el examen',
                        items: { type: 'string', format: 'uuid' },
                    },
                    assignmentsCreated: {
                        type: 'integer',
                        description: 'Número de estudiantes a los que se les asignó el examen',
                        example: 25,
                    },
                    applicationDate: { type: 'string', format: 'date-time' },
                    durationMinutes: { type: 'integer', example: 90 },
                    examStatus: {
                        type: 'string',
                        enum: ['published'],
                        description: 'Nuevo estado del examen (PUBLISHED)',
                    },
                },
            },
            StudentExamAssignmentListResponse: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID de la asignación (ExamAssignment)',
                    },
                    examId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID del examen',
                    },
                    subjectName: {
                        type: 'string',
                        description: 'Nombre de la asignatura',
                        example: 'Matemáticas Avanzadas',
                    },
                    professorName: {
                        type: 'string',
                        description: 'Nombre del profesor que asignó el examen',
                        example: 'Juan Pérez',
                    },
                    status: {
                        type: 'string',
                        enum: [
                            'PENDING',
                            'ENABLED',
                            'IN_EVALUATION',
                            'SUBMITTED',
                            'GRADED',
                            'CANCELLED',
                        ],
                        description: 'Estado de la asignación',
                        example: 'PENDING',
                    },
                    applicationDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Fecha y hora programada para el examen',
                    },
                    durationMinutes: {
                        type: 'integer',
                        description: 'Duración del examen en minutos',
                        example: 90,
                    },
                    grade: {
                        type: 'number',
                        nullable: true,
                        description: 'Nota final obtenida por el estudiante (si ya fue evaluado)',
                        example: 18.5,
                    },
                },
            },
            PendingExamRegradeListItem: {
                allOf: [
                    { $ref: '#/components/schemas/StudentExamAssignmentListResponse' },
                    {
                        type: 'object',
                        properties: {
                            regradeId: {
                                type: 'string',
                                format: 'uuid',
                                description: 'ID de la solicitud de recalificación',
                            },
                            reason: {
                                type: 'string',
                                nullable: true,
                                description: 'Motivo proporcionado por el estudiante',
                            },
                            requestedAt: {
                                type: 'string',
                                format: 'date-time',
                                description: 'Fecha en la que se solicitó la recalificación',
                            },
                            regradeStatus: {
                                type: 'string',
                                enum: ['REQUESTED', 'IN_REVIEW'],
                                description: 'Estado actual de la solicitud de recalificación',
                            },
                        },
                        required: ['regradeId', 'requestedAt', 'regradeStatus'],
                    },
                ],
            },
            ExamResponseInput: {
                type: 'object',
                required: ['examId', 'examQuestionId'],
                properties: {
                    examId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID del examen',
                    },
                    examQuestionId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID de la pregunta del examen (ExamQuestion)',
                    },
                    selectedOptions: {
                        type: 'array',
                        nullable: true,
                        items: {
                            type: 'object',
                            properties: {
                                text: { type: 'string' },
                                isCorrect: { type: 'boolean' },
                            },
                        },
                        description:
                            'Opciones seleccionadas (para preguntas de selección múltiple o única)',
                    },
                    textAnswer: {
                        type: 'string',
                        nullable: true,
                        description: 'Respuesta de texto (para preguntas abiertas)',
                    },
                },
            },
            ExamResponseOutput: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    examId: { type: 'string', format: 'uuid' },
                    examQuestionId: { type: 'string', format: 'uuid' },
                    studentId: { type: 'string', format: 'uuid' },
                    selectedOptions: {
                        type: 'array',
                        nullable: true,
                        items: {
                            type: 'object',
                            properties: {
                                text: { type: 'string' },
                                isCorrect: { type: 'boolean' },
                            },
                        },
                    },
                    textAnswer: { type: 'string', nullable: true },
                    autoPoints: {
                        type: 'number',
                        description: 'Puntos calculados automáticamente',
                    },
                    manualPoints: {
                        type: 'number',
                        nullable: true,
                        description: 'Puntos asignados manualmente (si aplica)',
                    },
                    answeredAt: { type: 'string', format: 'date-time' },
                },
            },
            ExamResponseSuccessResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/ExamResponseOutput' },
                },
            },
            CalculateExamGradeResult: {
                type: 'object',
                properties: {
                    assignmentId: { type: 'string', format: 'uuid' },
                    examId: { type: 'string', format: 'uuid' },
                    studentId: { type: 'string', format: 'uuid' },
                    finalGrade: { type: 'number' },
                    examTotalScore: { type: 'number' },
                },
                required: ['assignmentId', 'examId', 'studentId', 'finalGrade', 'examTotalScore'],
            },
            RequestExamRegradeInput: {
                type: 'object',
                required: ['examId', 'professorId'],
                properties: {
                    examId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID del examen para el cual se solicita recalificación',
                    },
                    professorId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID del profesor al que se solicita la recalificación',
                    },
                    reason: {
                        type: 'string',
                        nullable: true,
                        minLength: 10,
                        description: 'Razón de la solicitud de recalificación',
                        example: 'Considero que la pregunta 5 fue calificada incorrectamente',
                    },
                },
            },
            ExamRegradeOutput: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    studentId: { type: 'string', format: 'uuid' },
                    examId: { type: 'string', format: 'uuid' },
                    professorId: { type: 'string', format: 'uuid' },
                    reason: { type: 'string', nullable: true },
                    status: {
                        type: 'string',
                        enum: ['REQUESTED', 'IN_REVIEW', 'RESOLVED', 'REJECTED'],
                        description: 'Estado de la solicitud de recalificación',
                    },
                    requestedAt: { type: 'string', format: 'date-time' },
                    resolvedAt: { type: 'string', format: 'date-time', nullable: true },
                    finalGrade: { type: 'number', nullable: true },
                },
            },

            // ===== QUESTION-BANK: componentes consistentes =====
            Subject: subjectSchema,

            // ÚNICOS válidos (no repitas estos nombres en otro lado):
            SubtopicDetail: subtopicDetailSchema,
            SubjectRef: subjectRefSchema,
            TopicDetail: topicDetailSchema_correct,
            SubjectDetail: subjectDetailSchema,

            Question: {
                type: 'object',
                properties: {
                    questionId: { type: 'string', format: 'uuid' },
                    authorId: { type: 'string', format: 'uuid' },
                    questionTypeId: { type: 'string', format: 'uuid' },
                    subtopicId: { type: 'string', format: 'uuid' },
                    difficulty: {
                        type: 'string',
                        enum: ['EASY', 'MEDIUM', 'HARD'],
                    },
                    body: { type: 'string' },
                    options: {
                        type: 'array',
                        nullable: true,
                        items: {
                            type: 'object',
                            properties: {
                                text: { type: 'string' },
                                isCorrect: { type: 'boolean' },
                            },
                            required: ['text', 'isCorrect'],
                            additionalProperties: false,
                        },
                    },
                    response: { type: 'string', nullable: true },
                    active: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
                required: [
                    'questionId',
                    'authorId',
                    'questionTypeId',
                    'subtopicId',
                    'difficulty',
                    'body',
                    'active',
                    'createdAt',
                    'updatedAt',
                ],
                additionalProperties: false,
            },
            ExamQuestionPreview: examQuestionPreviewSchema,
            ExamQuestion: examQuestionLinkSchema,
            Exam: examBaseSchema,
            CreateManualExamInput: createManualExamInputSchema,
            CreateAutomaticExamInput: createAutomaticExamInputSchema,
            ExamDecisionInput: examDecisionInputSchema,
            AutomaticExamPreview: automaticExamPreviewSchemaDoc,
            UpdateExamInput: updateExamInputSchema,
            ListExamsResponse: listExamsResponseSchema,
            ExamDetailResponse: examDetailResponseSchema,
            AutomaticExamPreviewResponse: automaticExamPreviewResponseSchema,

            // Wrappers de Subjects
            RetrieveOneSubjectDetailResponse: {
                type: 'object',
                properties: {
                    data: { $ref: '#/components/schemas/SubjectDetail' },
                    success: { type: 'boolean', example: true },
                },
                required: ['data'],
                additionalProperties: false,
            },
            PaginatedSubjectDetailResponse: {
                type: 'object',
                properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/SubjectDetail' } },
                    meta: paginationMetaSchema,
                },
                required: ['data', 'meta'],
                additionalProperties: false,
            },

            // Inputs Subjects
            CreateSubjectInput: {
                type: 'object',
                properties: {
                    subject_name: { type: 'string' },
                    subject_program: { type: 'string' },
                },
                required: ['subject_name', 'subject_program'],
            },
            UpdateSubjectInput: {
                type: 'object',
                properties: {
                    subject_name: { type: 'string' },
                    subject_program: { type: 'string' },
                },
            },

            // ===== QUESTION-TYPES =====
            QuestionType: questionTypeSchema,

            RetrieveOneQuestionTypeResponse: {
                type: 'object',
                properties: {
                    data: { $ref: '#/components/schemas/QuestionType' },
                    success: { type: 'boolean', example: true },
                },
                required: ['data'],
                additionalProperties: false,
            },

            ListQuestionTypesResponse: {
                type: 'object',
                properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/QuestionType' } },
                    meta: paginationMetaSchema,
                },
                required: ['data', 'meta'],
                additionalProperties: false,
            },

            CreateQuestionTypeInput: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Valor del QuestionTypeEnum definido en el backend',
                        example: 'MULTIPLE_CHOICE',
                    },
                },
                required: ['name'],
                additionalProperties: false,
            },

            UpdateQuestionTypeInput: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Nuevo valor del QuestionTypeEnum',
                        example: 'TRUE_FALSE',
                    },
                },
                additionalProperties: false,
            },

            // Inputs Questions
            // Inputs Questions
            CreateQuestionInput: {
                type: 'object',
                properties: {
                    questionTypeId: { type: 'string', format: 'uuid' },
                    subtopicId: { type: 'string', format: 'uuid' },
                    difficulty: {
                        type: 'string',
                        enum: ['EASY', 'MEDIUM', 'HARD'],
                    },
                    body: { type: 'string' },
                    options: {
                        type: 'array',
                        nullable: true,
                        items: {
                            type: 'object',
                            properties: {
                                text: { type: 'string' },
                                isCorrect: { type: 'boolean' },
                            },
                            required: ['text', 'isCorrect'],
                            additionalProperties: false,
                        },
                    },
                    response: { type: 'string', nullable: true },
                },
                required: ['questionTypeId', 'subtopicId', 'difficulty', 'body'],
            },
            UpdateQuestionInput: {
                type: 'object',
                properties: {
                    questionTypeId: { type: 'string', format: 'uuid' },
                    subtopicId: { type: 'string', format: 'uuid' },
                    difficulty: {
                        type: 'string',
                        enum: ['EASY', 'MEDIUM', 'HARD'],
                    },
                    body: { type: 'string' },
                    options: {
                        type: 'array',
                        nullable: true,
                        items: {
                            type: 'object',
                            properties: {
                                text: { type: 'string' },
                                isCorrect: { type: 'boolean' },
                            },
                            required: ['text', 'isCorrect'],
                            additionalProperties: false,
                        },
                    },
                    response: { type: 'string', nullable: true },
                },
            },

            // ===== ANALYTICS =====
            AutomaticExamReportRow: {
                type: 'object',
                properties: {
                    examId: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    subjectId: { type: 'string', format: 'uuid' },
                    subjectName: { type: 'string', nullable: true },
                    creatorId: { type: 'string', format: 'uuid' },
                    creatorName: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    parameters: {
                        type: 'object',
                        nullable: true,
                        additionalProperties: true,
                    },
                },
                required: ['examId', 'title', 'subjectId', 'creatorId', 'createdAt'],
            },
            AutomaticExamReportResponse: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/AutomaticExamReportRow' },
                    },
                    meta: paginationMetaSchema,
                },
                required: ['data', 'meta'],
            },
            PopularQuestionsReportRow: {
                type: 'object',
                properties: {
                    questionId: { type: 'string', format: 'uuid' },
                    questionBody: { type: 'string', nullable: true },
                    difficulty: {
                        type: 'string',
                        enum: ['EASY', 'MEDIUM', 'HARD'],
                    },
                    topicId: { type: 'string', format: 'uuid', nullable: true },
                    topicName: { type: 'string', nullable: true },
                    usageCount: { type: 'integer' },
                },
                required: ['questionId', 'difficulty', 'usageCount'],
            },
            PopularQuestionsReportResponse: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/PopularQuestionsReportRow' },
                    },
                    meta: paginationMetaSchema,
                },
                required: ['data', 'meta'],
            },
            ValidatedExamReportRow: {
                type: 'object',
                properties: {
                    examId: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    subjectId: { type: 'string', format: 'uuid' },
                    subjectName: { type: 'string', nullable: true },
                    validatedAt: { type: 'string', format: 'date-time', nullable: true },
                    observations: { type: 'string', nullable: true },
                    validatorId: { type: 'string', format: 'uuid' },
                },
                required: ['examId', 'title', 'subjectId', 'validatorId'],
            },
            ValidatedExamsReportResponse: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ValidatedExamReportRow' },
                    },
                    meta: paginationMetaSchema,
                },
                required: ['data', 'meta'],
            },
            ExamPerformanceRow: {
                type: 'object',
                properties: {
                    examQuestionId: { type: 'string', format: 'uuid' },
                    questionId: { type: 'string', format: 'uuid' },
                    questionIndex: { type: 'integer' },
                    questionScore: { type: 'number' },
                    difficulty: {
                        type: 'string',
                        enum: ['EASY', 'MEDIUM', 'HARD'],
                    },
                    topicId: { type: 'string', format: 'uuid', nullable: true },
                    topicName: { type: 'string', nullable: true },
                    averageScore: { type: 'number' },
                    successRate: { type: 'number' },
                    attempts: { type: 'integer' },
                    questionBody: { type: 'string', nullable: true },
                },
                required: [
                    'examQuestionId',
                    'questionId',
                    'questionIndex',
                    'questionScore',
                    'difficulty',
                    'averageScore',
                    'successRate',
                    'attempts',
                ],
            },
            ExamPerformanceReport: {
                type: 'object',
                properties: {
                    examId: { type: 'string', format: 'uuid' },
                    questions: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ExamPerformanceRow' },
                    },
                    overallSuccessRate: { type: 'number' },
                    difficultyGroups: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/SubjectDifficultyDetail' },
                    },
                },
                required: ['examId', 'questions', 'overallSuccessRate', 'difficultyGroups'],
            },
            ExamPerformanceReportResponse: {
                type: 'object',
                properties: {
                    data: { $ref: '#/components/schemas/ExamPerformanceReport' },
                },
                required: ['data'],
            },
            SubjectDifficultyDetail: {
                type: 'object',
                properties: {
                    difficulty: {
                        type: 'string',
                        enum: ['EASY', 'MEDIUM', 'HARD'],
                    },
                    averageGrade: { type: 'number', nullable: true },
                    examCount: { type: 'integer' },
                },
                required: ['difficulty', 'examCount'],
            },
            SubjectDifficultyCorrelationRow: {
                type: 'object',
                properties: {
                    subjectId: { type: 'string', format: 'uuid' },
                    subjectName: { type: 'string', nullable: true },
                    correlationScore: { type: 'number' },
                    difficultyDetails: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/SubjectDifficultyDetail' },
                    },
                },
                required: ['subjectId', 'correlationScore', 'difficultyDetails'],
            },
            TopFailingQuestionRow: {
                type: 'object',
                properties: {
                    questionId: { type: 'string', format: 'uuid' },
                    topicId: { type: 'string', format: 'uuid', nullable: true },
                    topicName: { type: 'string', nullable: true },
                    subjectId: { type: 'string', format: 'uuid', nullable: true },
                    subjectName: { type: 'string', nullable: true },
                    authorId: { type: 'string', format: 'uuid', nullable: true },
                    authorName: { type: 'string', nullable: true },
                    failureRate: { type: 'number' },
                },
                required: ['questionId', 'failureRate'],
            },
            RegradeComparisonRow: {
                type: 'object',
                properties: {
                    subjectId: { type: 'string', format: 'uuid' },
                    subjectName: { type: 'string', nullable: true },
                    course: { type: 'string' },
                    regradeAverage: { type: 'number', nullable: true },
                    courseAverage: { type: 'number', nullable: true },
                    requests: { type: 'integer' },
                },
                required: ['subjectId', 'course', 'requests'],
            },
            SubjectDifficultyReport: {
                type: 'object',
                properties: {
                    subjectCorrelations: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/SubjectDifficultyCorrelationRow' },
                    },
                    topFailingQuestions: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/TopFailingQuestionRow' },
                    },
                    regradeComparison: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/RegradeComparisonRow' },
                    },
                },
                required: ['subjectCorrelations', 'topFailingQuestions', 'regradeComparison'],
            },
            SubjectDifficultyReportResponse: {
                type: 'object',
                properties: {
                    data: { $ref: '#/components/schemas/SubjectDifficultyReport' },
                },
                required: ['data'],
            },
            ExamComparisonTopicDistribution: {
                type: 'object',
                properties: {
                    topicId: { type: 'string', format: 'uuid', nullable: true },
                    topicName: { type: 'string', nullable: true },
                    questionCount: { type: 'integer' },
                },
                required: ['questionCount'],
            },
            ExamComparisonRow: {
                type: 'object',
                properties: {
                    examId: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    subjectId: { type: 'string', format: 'uuid' },
                    subjectName: { type: 'string', nullable: true },
                    difficultyDistribution: {
                        type: 'object',
                        properties: {
                            EASY: { type: 'number' },
                            MEDIUM: { type: 'number' },
                            HARD: { type: 'number' },
                        },
                    },
                    totalQuestions: { type: 'integer' },
                    topicDistribution: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ExamComparisonTopicDistribution' },
                    },
                    balanceGap: { type: 'number' },
                    balanced: { type: 'boolean' },
                },
                required: [
                    'examId',
                    'title',
                    'difficultyDistribution',
                    'totalQuestions',
                    'balanced',
                ],
            },
            ExamComparisonReportResponse: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ExamComparisonRow' },
                    },
                    meta: paginationMetaSchema,
                },
                required: ['data', 'meta'],
            },
            ReviewerActivityRow: {
                type: 'object',
                properties: {
                    reviewerId: { type: 'string', format: 'uuid' },
                    reviewerName: { type: 'string', nullable: true },
                    subjectId: { type: 'string', format: 'uuid' },
                    subjectName: { type: 'string', nullable: true },
                    reviewedExams: { type: 'integer' },
                },
                required: ['reviewerId', 'subjectId', 'reviewedExams'],
            },
            ReviewerActivityReportResponse: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ReviewerActivityRow' },
                    },
                    meta: paginationMetaSchema,
                },
                required: ['data', 'meta'],
            },

            // También puedes añadir wrappers de Topics/Subtopics/Questions si quieres
        },
    },
};

const swaggerOptions = {
    definition: swaggerDefinition,
    apis: ['./app/domains/**/api/routes/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
