import swaggerJsdoc from "swagger-jsdoc";

const roleEnum = ["student", "teacher", "admin", "subject_leader", "examiner"];

const studentSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    name: { type: "string", example: "Jane Doe" },
    email: { type: "string", format: "email", example: "jane@example.com" },
    role: { type: "string", enum: roleEnum },
    age: { type: "integer", example: 21 },
    course: { type: "integer", example: 3 },
  },
  required: ["id", "userId", "name", "email", "role", "age", "course"],
};

const userSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string", example: "John Doe" },
    email: { type: "string", format: "email", example: "john@example.com" },
    role: { type: "string", enum: roleEnum },
  },
  required: ["id", "name", "email", "role"],
};

const paginationMetaSchema = {
  type: "object",
  properties: {
    limit: { type: "integer", example: 20 },
    offset: { type: "integer", example: 0 },
    total: { type: "integer", example: 2 },
  },
  required: ["limit", "offset", "total"],
};

const teacherSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    name: { type: "string", example: "Alice Smith" },
    email: { type: "string", format: "email", example: "alice@example.com" },
    role: { type: "string", enum: roleEnum },
    specialty: { type: "string", example: "Bases de datos" },
    hasRoleSubjectLeader: { type: "boolean" },
    hasRoleExaminer: { type: "boolean" },
  },
  required: ["id", "userId", "name", "email", "role", "specialty", "hasRoleSubjectLeader", "hasRoleExaminer"],
};

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Management System API",
    version: "1.0.0",
    description: "API para gestionar usuarios y estudiantes dentro del sistema de exámenes automáticos.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Servidor local",
    },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", minLength: 8, example: "mypassword123" },
        },
        required: ["email", "password"],
      },
      LoginResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Login successful" },
          data: {
            type: "object",
            properties: {
              token: { type: "string", example: "eyJhbGciOi..." },
              user: { $ref: "#/components/schemas/User" },
            },
            required: ["token", "user"],
          },
        },
        required: ["success", "message", "data"],
      },
      Student: studentSchema,
      User: userSchema,
      Teacher: teacherSchema,
      ListStudentsResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Student" },
          },
          meta: paginationMetaSchema,
        },
        required: ["data", "meta"],
      },
      ListUsersResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/User" },
          },
          meta: paginationMetaSchema,
        },
        required: ["data", "meta"],
      },
      ListTeachersResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Teacher" },
          },
          meta: paginationMetaSchema,
        },
        required: ["data", "meta"],
      },
      CreateStudentInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          age: { type: "integer" },
          course: { type: "integer" },
        },
        required: ["name", "email", "password", "age", "course"],
      },
      UpdateStudentInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: roleEnum },
          password: { type: "string", minLength: 8 },
          age: { type: "integer" },
          course: { type: "integer" },
        },
      },
      CreateUserInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: roleEnum },
          password: { type: "string", minLength: 8 },
        },
        required: ["name", "email", "role", "password"],
      },
      UpdateUserInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: roleEnum },
          password: { type: "string", minLength: 8 },
        },
      },
      CreateTeacherInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          role: { type: "string", enum: roleEnum },
          specialty: { type: "string" },
          hasRoleSubjectLeader: { type: "boolean" },
          hasRoleExaminer: { type: "boolean" },
        },
        required: ["name", "email", "password", "role", "specialty"],
      },
      UpdateTeacherInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          role: { type: "string", enum: roleEnum },
          specialty: { type: "string" },
          hasRoleSubjectLeader: { type: "boolean" },
          hasRoleExaminer: { type: "boolean" },
        },
      },
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ["./app/domains/**/api/routes/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
