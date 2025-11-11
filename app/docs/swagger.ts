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
    'subject_leader_name',
    'topics_amount',
    'topics',
  ],
  additionalProperties: false,
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

      // ===== QUESTION-BANK: componentes consistentes =====
      Subject: subjectSchema,

      // ÚNICOS válidos (no repitas estos nombres en otro lado):
      SubtopicDetail: subtopicDetailSchema,
      SubjectRef: subjectRefSchema,
      TopicDetail: topicDetailSchema_correct,
      SubjectDetail: subjectDetailSchema,

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

      // También puedes añadir wrappers de Topics/Subtopics si quieres
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ['./app/domains/**/api/routes/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
