import { sequelize } from './database';
import { getHasher } from '../core/security/hasher';
import { AssignedExamStatus } from '../domains/exam-application/entities/enums/AssignedExamStatus';
import { ExamRegradesStatus } from '../domains/exam-application/entities/enums/ExamRegradeStatus';
import { ExamStatusEnum } from '../domains/exam-application/entities/enums/ExamStatusEnum';
import { DifficultyLevelEnum } from '../domains/question-bank/entities/enums/DifficultyLevels';
import { QuestionTypeEnum } from '../domains/question-bank/entities/enums/QuestionType';
import ExamAssignment from '../infrastructure/exam-application/models/ExamAssignment';
import ExamRegrade from '../infrastructure/exam-application/models/ExamRegrade';
import ExamResponse from '../infrastructure/exam-application/models/ExamResponse';
import Exam from '../infrastructure/exam-generation/models/Exam';
import ExamQuestion from '../infrastructure/exam-generation/models/ExamQuestion';
import {
    Subject,
    Topic,
    SubTopic as Subtopic,
    SubjectTopic,
} from '../infrastructure/question-bank/models';
import Question from '../infrastructure/question-bank/models/Question';
import QuestionType from '../infrastructure/question-bank/models/QuestionType';
import TeacherSubject from '../infrastructure/question-bank/models/TeacherSubject';
import { Student, Teacher, User } from '../infrastructure/user/models';
import { Roles } from '../shared/enums/rolesEnum';

type QuestionSeed = {
    type: QuestionTypeEnum;
    difficulty: DifficultyLevelEnum;
    body: string;
    options?: Array<{ text: string; isCorrect: boolean }>;
    response?: string | null;
};

type SubtopicSeed = {
    name: string;
    questions: QuestionSeed[];
};

type TopicSeed = {
    title: string;
    subtopics: SubtopicSeed[];
};

type SubjectSeed = {
    name: string;
    program: string;
    leadTeacherEmail: string;
    topics: TopicSeed[];
};

type QuestionMeta = {
    id: string;
    topicId: string;
    difficulty: DifficultyLevelEnum;
};

type ExamSeed = {
    subjectName: string;
    title: string;
    questionCount: number;
    difficulty: DifficultyLevelEnum;
    examStatus: ExamStatusEnum;
    startIndex: number;
};

const questionScoreByDifficulty: Record<DifficultyLevelEnum, number> = {
    [DifficultyLevelEnum.EASY]: 2,
    [DifficultyLevelEnum.MEDIUM]: 3,
    [DifficultyLevelEnum.HARD]: 4,
};

const examSeedData: ExamSeed[] = [
    {
        subjectName: 'Bases de Datos I',
        title: 'Parcial 1 - Modelo relacional',
        questionCount: 6,
        difficulty: DifficultyLevelEnum.MEDIUM,
        examStatus: ExamStatusEnum.DRAFT,
        startIndex: 0,
    },
    {
        subjectName: 'Bases de Datos I',
        title: 'Parcial 2 - Consultas y rendimiento',
        questionCount: 7,
        difficulty: DifficultyLevelEnum.MEDIUM,
        examStatus: ExamStatusEnum.UNDER_REVIEW,
        startIndex: 4,
    },
    {
        subjectName: 'Bases de Datos I',
        title: 'Examen Final - Transacciones y ACID',
        questionCount: 8,
        difficulty: DifficultyLevelEnum.HARD,
        examStatus: ExamStatusEnum.APPROVED,
        startIndex: 8,
    },
    {
        subjectName: 'Programación I',
        title: 'Parcial 1 - Lógica y control',
        questionCount: 6,
        difficulty: DifficultyLevelEnum.EASY,
        examStatus: ExamStatusEnum.DRAFT,
        startIndex: 0,
    },
    {
        subjectName: 'Programación I',
        title: 'Parcial 2 - Estructuras y cadenas',
        questionCount: 7,
        difficulty: DifficultyLevelEnum.MEDIUM,
        examStatus: ExamStatusEnum.APPROVED,
        startIndex: 5,
    },
    {
        subjectName: 'Matemáticas Discretas',
        title: 'Evaluación 1 - Lógica proposicional',
        questionCount: 5,
        difficulty: DifficultyLevelEnum.MEDIUM,
        examStatus: ExamStatusEnum.APPROVED,
        startIndex: 0,
    },
    {
        subjectName: 'Matemáticas Discretas',
        title: 'Evaluación Final - Conjuntos y funciones',
        questionCount: 6,
        difficulty: DifficultyLevelEnum.HARD,
        examStatus: ExamStatusEnum.PUBLISHED,
        startIndex: 4,
    },
];

const teacherSeedData = [
    {
        name: 'Teacher One',
        email: 'teacher1@example.com',
        specialty: 'Bases de datos',
        hasRoleSubjectLeader: true,
        hasRoleExaminer: true,
    },
    {
        name: 'Teacher Two',
        email: 'teacher2@example.com',
        specialty: 'Ingeniería de software',
        hasRoleSubjectLeader: true,
        hasRoleExaminer: true,
    },
    {
        name: 'Teacher Three',
        email: 'teacher3@example.com',
        specialty: 'Matemáticas discretas',
        hasRoleSubjectLeader: true,
        hasRoleExaminer: true,
    },
] as const;

const studentSeedData = [
    { name: 'Ana Estudiante', email: 'student1@example.com', age: 20, course: 1 },
    { name: 'Bruno Cadete', email: 'student2@example.com', age: 22, course: 2 },
    { name: 'Carla Dev', email: 'student3@example.com', age: 21, course: 3 },
    { name: 'Diego Tester', email: 'student4@example.com', age: 23, course: 4 },
] as const;

type ExamResponseSeed = {
    questionIndex: number;
    selectedOptions?: Array<{ text: string; isCorrect: boolean }>;
    textAnswer?: string;
    autoPoints?: number | null;
    manualPoints?: number | null;
    answeredAt: Date;
};

type ExamRegradeSeed = {
    reason: string;
    status: ExamRegradesStatus;
    requestedAt: Date;
    resolvedAt: Date | null;
    finalGrade: number | null;
    reviewerEmail?: string;
};

type ExamAssignmentSeed = {
    studentEmail: string;
    status: AssignedExamStatus;
    applicationDate: Date;
    durationMinutes: number;
    grade?: number | null;
    professorEmail?: string;
    responses?: ExamResponseSeed[];
    regrade?: ExamRegradeSeed;
};

const assignmentSeedByExamTitle: Record<string, ExamAssignmentSeed[]> = {
    'Examen Final - Transacciones y ACID': [
        {
            studentEmail: 'student1@example.com',
            status: AssignedExamStatus.ENABLED,
            applicationDate: new Date('2024-01-01T08:00:00Z'),
            durationMinutes: 1100000, // approx. 2.1 years to keep the exam active through 2026
        },
    ],
    'Parcial 2 - Estructuras y cadenas': [
        {
            studentEmail: 'student2@example.com',
            status: AssignedExamStatus.IN_EVALUATION,
            applicationDate: new Date('2024-06-05T09:30:00Z'),
            durationMinutes: 90,
            responses: [
                {
                    questionIndex: 1,
                    selectedOptions: [
                        { text: 'Aplicar una pila para invertir cadenas', isCorrect: true },
                    ],
                    autoPoints: 3,
                    manualPoints: null,
                    answeredAt: new Date('2024-06-05T10:10:00Z'),
                },
            ],
        },
    ],
    'Evaluación Final - Conjuntos y funciones': [
        {
            studentEmail: 'student3@example.com',
            status: AssignedExamStatus.PENDING,
            applicationDate: new Date('2024-06-10T08:00:00Z'),
            durationMinutes: 100,
            responses: [
                {
                    questionIndex: 1,
                    textAnswer:
                        'Una función es biyectiva cuando es inyectiva y sobreyectiva al mismo tiempo.',
                    autoPoints: 0,
                    manualPoints: null,
                    answeredAt: new Date('2024-06-10T09:05:00Z'),
                },
            ],
        },
    ],
};

const subjectSeedData: SubjectSeed[] = [
    {
        name: 'Bases de Datos I',
        program: 'Programa oficial Bases de Datos I 2024',
        leadTeacherEmail: 'teacher1@example.com',
        topics: [
            {
                title: 'Modelo relacional y diseño',
                subtopics: [
                    {
                        name: 'Llaves primarias',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.EASY,
                                body: '¿Qué requisito debe cumplir una llave primaria en una tabla relacional?',
                                options: [
                                    { text: 'Permitir valores duplicados', isCorrect: false },
                                    { text: 'Aceptar valores NULL', isCorrect: false },
                                    { text: 'Ser única y no nula', isCorrect: true },
                                    { text: 'Cambiar en cada inserción', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.TRUE_FALSE,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: 'Una tabla puede definir varias llaves primarias al mismo tiempo.',
                                options: [
                                    { text: 'Verdadero', isCorrect: false },
                                    { text: 'Falso', isCorrect: true },
                                ],
                            },
                        ],
                    },
                    {
                        name: 'Normalización 3FN',
                        questions: [
                            {
                                type: QuestionTypeEnum.ESSAY,
                                difficulty: DifficultyLevelEnum.HARD,
                                body: 'Explica el proceso para llevar una tabla desde 1FN hasta 3FN usando un ejemplo simple.',
                                response:
                                    'Debe describir eliminación de grupos repetitivos, claves parciales y dependencias transitivas.',
                            },
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: '¿Qué problema mitiga la tercera forma normal?',
                                options: [
                                    {
                                        text: 'Redundancias y dependencias transitivas',
                                        isCorrect: true,
                                    },
                                    { text: 'La ausencia de índices', isCorrect: false },
                                    { text: 'La falta de claves primarias', isCorrect: false },
                                    { text: 'Los errores de transacciones', isCorrect: false },
                                ],
                            },
                        ],
                    },
                    {
                        name: 'Consultas SELECT básicas',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.EASY,
                                body: '¿Qué cláusula se utiliza para ordenar los resultados de una consulta SELECT?',
                                options: [
                                    { text: 'GROUP BY', isCorrect: false },
                                    { text: 'WHERE', isCorrect: false },
                                    { text: 'ORDER BY', isCorrect: true },
                                    { text: 'HAVING', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.TRUE_FALSE,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: 'La cláusula WHERE se evalúa después de ORDER BY en SQL estándar.',
                                options: [
                                    { text: 'Verdadero', isCorrect: false },
                                    { text: 'Falso', isCorrect: true },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Transacciones y rendimiento',
                subtopics: [
                    {
                        name: 'Propiedades ACID',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: '¿Qué propiedad ACID garantiza que una transacción completada permanezca almacenada?',
                                options: [
                                    { text: 'Atomicidad', isCorrect: false },
                                    { text: 'Consistencia', isCorrect: false },
                                    { text: 'Durabilidad', isCorrect: true },
                                    { text: 'Aislamiento', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.ESSAY,
                                difficulty: DifficultyLevelEnum.HARD,
                                body: 'Describe cada letra del acrónimo ACID e indica qué riesgo mitiga.',
                                response:
                                    'Debe cubrir Atomicidad, Consistencia, Aislamiento y Durabilidad con un ejemplo por propiedad.',
                            },
                        ],
                    },
                    {
                        name: 'Control de concurrencia',
                        questions: [
                            {
                                type: QuestionTypeEnum.TRUE_FALSE,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: 'El protocolo de dos fases evita por completo los interbloqueos.',
                                options: [
                                    { text: 'Verdadero', isCorrect: false },
                                    { text: 'Falso', isCorrect: true },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.HARD,
                                body: '¿Cuál es la causa más común de un deadlock en bases de datos?',
                                options: [
                                    { text: 'Lecturas repetidas', isCorrect: false },
                                    {
                                        text: 'Asignar y retener recursos en distinto orden',
                                        isCorrect: true,
                                    },
                                    { text: 'Indices mal definidos', isCorrect: false },
                                    { text: 'Falta de normalización', isCorrect: false },
                                ],
                            },
                        ],
                    },
                    {
                        name: 'Índices y optimización',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: '¿Cuál es una ventaja principal de un índice B-Tree?',
                                options: [
                                    {
                                        text: 'Inserciones desordenadas más lentas',
                                        isCorrect: false,
                                    },
                                    { text: 'Búsquedas logarítmicas', isCorrect: true },
                                    { text: 'Evita la fragmentación de disco', isCorrect: false },
                                    { text: 'Solo almacena valores numéricos', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.ESSAY,
                                difficulty: DifficultyLevelEnum.HARD,
                                body: 'Enuncia dos escenarios en los que un índice compuesto mejora el rendimiento.',
                                response:
                                    'Debe mencionar filtros combinados y patrones de ordenamiento frecuentes.',
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        name: 'Programación I',
        program: 'Programa introductorio de algoritmos y lógica 2024',
        leadTeacherEmail: 'teacher2@example.com',
        topics: [
            {
                title: 'Estructuras de control',
                subtopics: [
                    {
                        name: 'Condicionales',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.EASY,
                                body: '¿Qué palabra clave cierra un bloque if/else en la mayoría de lenguajes C-like?',
                                options: [
                                    { text: 'end', isCorrect: false },
                                    { text: 'fi', isCorrect: false },
                                    { text: '}', isCorrect: true },
                                    { text: 'stop', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.ESSAY,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: 'Describe cuándo usarías una cadena de if/else versus una sentencia switch.',
                                response:
                                    'Debe comparar expresiones booleanas complejas frente a evaluaciones discretas.',
                            },
                        ],
                    },
                    {
                        name: 'Bucles',
                        questions: [
                            {
                                type: QuestionTypeEnum.TRUE_FALSE,
                                difficulty: DifficultyLevelEnum.EASY,
                                body: 'Un bucle for conoce la cantidad de iteraciones antes de ejecutarse.',
                                options: [
                                    { text: 'Verdadero', isCorrect: true },
                                    { text: 'Falso', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: '¿Qué diferencia fundamental existe entre while y do-while?',
                                options: [
                                    {
                                        text: 'do-while evalúa la condición al final',
                                        isCorrect: true,
                                    },
                                    { text: 'while no acepta break', isCorrect: false },
                                    { text: 'do-while solo itera dos veces', isCorrect: false },
                                    { text: 'while requiere contadores pares', isCorrect: false },
                                ],
                            },
                        ],
                    },
                    {
                        name: 'Operadores lógicos',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: '¿Qué operador aplica cortocircuito al evaluar condiciones múltiples?',
                                options: [
                                    { text: 'AND (&)', isCorrect: false },
                                    { text: 'OR (|)', isCorrect: false },
                                    { text: 'AND lógico (&&)', isCorrect: true },
                                    { text: 'XOR (^)', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.ESSAY,
                                difficulty: DifficultyLevelEnum.HARD,
                                body: 'Explica con un ejemplo cómo construir una tabla de verdad para una expresión compuesta.',
                                response:
                                    'Debe proponer una expresión y detallar fila a fila los resultados.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Estructuras de datos básicas',
                subtopics: [
                    {
                        name: 'Arreglos',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.EASY,
                                body: '¿Cuál es el índice del primer elemento en un arreglo cero-indexado?',
                                options: [
                                    { text: '0', isCorrect: true },
                                    { text: '1', isCorrect: false },
                                    { text: '-1', isCorrect: false },
                                    { text: 'Depende del compilador', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.ESSAY,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: 'Explica la diferencia entre un vector unidimensional y una matriz bidimensional.',
                                response:
                                    'Debe citar memoria contigua y acceso mediante un índice versus dos índices.',
                            },
                        ],
                    },
                    {
                        name: 'Cadenas',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: '¿Qué característica hace que las cadenas sean inmutables en muchos lenguajes?',
                                options: [
                                    { text: 'Se almacenan en disco', isCorrect: false },
                                    {
                                        text: 'Se comparten entre hilos sin bloqueo',
                                        isCorrect: false,
                                    },
                                    {
                                        text: 'No pueden modificarse después de creadas',
                                        isCorrect: true,
                                    },
                                    { text: 'Solo aceptan números', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.TRUE_FALSE,
                                difficulty: DifficultyLevelEnum.EASY,
                                body: 'En C, una cadena puede representarse como un arreglo de caracteres terminado en \\0.',
                                options: [
                                    { text: 'Verdadero', isCorrect: true },
                                    { text: 'Falso', isCorrect: false },
                                ],
                            },
                        ],
                    },
                    {
                        name: 'Registros simples',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: '¿Qué palabra reservada define un registro (struct) en C?',
                                options: [
                                    { text: 'record', isCorrect: false },
                                    { text: 'struct', isCorrect: true },
                                    { text: 'class', isCorrect: false },
                                    { text: 'object', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.ESSAY,
                                difficulty: DifficultyLevelEnum.HARD,
                                body: 'Modela un registro que represente a un estudiante y explica cada campo.',
                                response:
                                    'Debe incluir nombre, código, promedio y justificar por qué cada campo es necesario.',
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        name: 'Matemáticas Discretas',
        program: 'Programa Matemáticas Discretas 2024',
        leadTeacherEmail: 'teacher3@example.com',
        topics: [
            {
                title: 'Lógica proposicional',
                subtopics: [
                    {
                        name: 'Tablas de verdad',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.EASY,
                                body: '¿Cuántas filas tiene la tabla de verdad de una proposición con dos variables?',
                                options: [
                                    { text: '2', isCorrect: false },
                                    { text: '4', isCorrect: true },
                                    { text: '8', isCorrect: false },
                                    { text: '16', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.TRUE_FALSE,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: 'Dos proposiciones son equivalentes si todas las filas de su tabla coinciden.',
                                options: [
                                    { text: 'Verdadero', isCorrect: true },
                                    { text: 'Falso', isCorrect: false },
                                ],
                            },
                        ],
                    },
                    {
                        name: 'Implicaciones',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: '¿En qué caso una implicación p->q es falsa?',
                                options: [
                                    {
                                        text: 'Cuando p es falsa y q es verdadera',
                                        isCorrect: false,
                                    },
                                    { text: 'Cuando p es verdadera y q es falsa', isCorrect: true },
                                    { text: 'Cuando ambas son falsas', isCorrect: false },
                                    { text: 'Nunca es falsa', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.ESSAY,
                                difficulty: DifficultyLevelEnum.HARD,
                                body: 'Demuestra con la tabla de verdad la equivalencia entre p->q y NOT p OR q.',
                                response:
                                    'Debe construir la tabla y resaltar las columnas idénticas para ambas expresiones.',
                            },
                        ],
                    },
                    {
                        name: 'Equivalencias',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: '¿Cuál es la forma normal disyuntiva de (p AND q) OR r?',
                                options: [
                                    { text: 'p AND (q OR r)', isCorrect: false },
                                    { text: '(p AND q) OR r', isCorrect: true },
                                    { text: '(p OR q) AND r', isCorrect: false },
                                    { text: '(p OR r) AND (q OR r)', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.ESSAY,
                                difficulty: DifficultyLevelEnum.HARD,
                                body: 'Explica cómo aplicar leyes de De Morgan para simplificar NOT (p OR NOT q).',
                                response: 'Debe demostrar que equivale a NOT p AND q.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Teoría de conjuntos',
                subtopics: [
                    {
                        name: 'Operaciones básicas',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.EASY,
                                body: 'Si A={1,2} y B={2,3}, ¿cuál es A U B?',
                                options: [
                                    { text: '{1,2,3}', isCorrect: true },
                                    { text: '{2}', isCorrect: false },
                                    { text: '{1,3}', isCorrect: false },
                                    { text: '{1,2}', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.TRUE_FALSE,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: 'La intersección de conjuntos disjuntos es el conjunto vacío.',
                                options: [
                                    { text: 'Verdadero', isCorrect: true },
                                    { text: 'Falso', isCorrect: false },
                                ],
                            },
                        ],
                    },
                    {
                        name: 'Relaciones',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: 'Una relación es reflexiva si...',
                                options: [
                                    {
                                        text: 'Cada elemento se relaciona consigo mismo',
                                        isCorrect: true,
                                    },
                                    { text: 'No existen elementos repetidos', isCorrect: false },
                                    { text: 'Todos los pares son simétricos', isCorrect: false },
                                    {
                                        text: 'Solo hay un elemento en el conjunto',
                                        isCorrect: false,
                                    },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.ESSAY,
                                difficulty: DifficultyLevelEnum.HARD,
                                body: 'Propón una relación que sea reflexiva y simétrica pero no transitiva.',
                                response:
                                    'Debe dar un ejemplo concreto sobre un conjunto pequeño y justificar cada propiedad.',
                            },
                        ],
                    },
                    {
                        name: 'Funciones',
                        questions: [
                            {
                                type: QuestionTypeEnum.MCQ,
                                difficulty: DifficultyLevelEnum.MEDIUM,
                                body: '¿Qué caracteriza a una función biyectiva?',
                                options: [
                                    {
                                        text: 'Es inyectiva y sobreyectiva a la vez',
                                        isCorrect: true,
                                    },
                                    { text: 'Solo es inyectiva', isCorrect: false },
                                    { text: 'Solo es sobreyectiva', isCorrect: false },
                                    { text: 'Es constante', isCorrect: false },
                                ],
                            },
                            {
                                type: QuestionTypeEnum.ESSAY,
                                difficulty: DifficultyLevelEnum.HARD,
                                body: 'Describe cómo construir la inversa de una función biyectiva.',
                                response:
                                    'Debe explicar la inversión de pares ordenados y el dominio/resultante.',
                            },
                        ],
                    },
                ],
            },
        ],
    },
];

async function seed() {
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    const questionMetaBySubjectId = new Map<string, QuestionMeta[]>();
    const subjectsByName = new Map<string, Subject>();
    const leadTeacherBySubjectId = new Map<string, Teacher>();
    const studentsByEmail = new Map<string, Student>();
    const examSummaries: string[] = [];

    try {
        const hasher = getHasher();
        const adminPasswordHash = await hasher.hash('123456789C');
        const teacherPasswordHash = await hasher.hash('profesor123');
        const studentPasswordHash = await hasher.hash('estudiante123');

        await User.findOrCreate({
            where: { email: 'admin@gmail.com' },
            defaults: {
                name: 'admin',
                email: 'admin@gmail.com',
                passwordHash: adminPasswordHash,
                role: Roles.ADMIN,
            },
            transaction: t,
        });

        const teacherProfilesByEmail = new Map<string, Teacher>();
        for (const teacherSeed of teacherSeedData) {
            const [user] = await User.findOrCreate({
                where: { email: teacherSeed.email },
                defaults: {
                    name: teacherSeed.name,
                    email: teacherSeed.email,
                    passwordHash: teacherPasswordHash,
                    role: Roles.TEACHER,
                },
                transaction: t,
            });

            if (user.role !== Roles.TEACHER) {
                user.set('role', Roles.TEACHER);
                await user.save({ transaction: t });
            }

            const [teacherProfile] = await Teacher.findOrCreate({
                where: { userId: user.id },
                defaults: {
                    userId: user.id,
                    specialty: teacherSeed.specialty,
                    hasRoleSubjectLeader: teacherSeed.hasRoleSubjectLeader,
                    hasRoleExaminer: teacherSeed.hasRoleExaminer,
                },
                transaction: t,
            });

            teacherProfilesByEmail.set(teacherSeed.email, teacherProfile);
        }

        for (const studentSeed of studentSeedData) {
            const [user] = await User.findOrCreate({
                where: { email: studentSeed.email },
                defaults: {
                    name: studentSeed.name,
                    email: studentSeed.email,
                    passwordHash: studentPasswordHash,
                    role: Roles.STUDENT,
                },
                transaction: t,
            });

            if (user.role !== Roles.STUDENT) {
                user.set('role', Roles.STUDENT);
                await user.save({ transaction: t });
            }

            const [studentProfile] = await Student.findOrCreate({
                where: { userId: user.id },
                defaults: {
                    userId: user.id,
                    age: studentSeed.age,
                    course: studentSeed.course,
                },
                transaction: t,
            });

            studentsByEmail.set(studentSeed.email, studentProfile);
        }

        for (const qt of Object.values(QuestionTypeEnum)) {
            await QuestionType.findOrCreate({
                where: { name: qt },
                defaults: { name: qt },
                transaction: t,
            });
        }

        const questionTypeRows = await QuestionType.findAll({ transaction: t });
        const questionTypeMap = questionTypeRows.reduce<Record<QuestionTypeEnum, string>>(
            (acc, row) => {
                acc[row.getDataValue('name') as QuestionTypeEnum] = row.getDataValue('id');
                return acc;
            },
            {} as Record<QuestionTypeEnum, string>,
        );

        const subjectSummaries: Array<{ name: string; topics: number; questions: number }> = [];

        for (const subjectSeed of subjectSeedData) {
            const teacherProfile = teacherProfilesByEmail.get(subjectSeed.leadTeacherEmail);
            if (!teacherProfile) {
                throw new Error(`No se encontró el profesor líder para ${subjectSeed.name}`);
            }

            const [subject] = await Subject.findOrCreate({
                where: { name: subjectSeed.name },
                defaults: {
                    name: subjectSeed.name,
                    program: subjectSeed.program,
                    leadTeacherId: teacherProfile.id,
                },
                transaction: t,
            });

            const subjectQuestionMeta: QuestionMeta[] = [];
            leadTeacherBySubjectId.set(subject.id, teacherProfile);
            subjectsByName.set(subjectSeed.name, subject);

            if (
                subject.getDataValue('leadTeacherId') !== teacherProfile.id ||
                subject.getDataValue('program') !== subjectSeed.program
            ) {
                subject.set({
                    leadTeacherId: teacherProfile.id,
                    program: subjectSeed.program,
                });
                await subject.save({ transaction: t });
            }

            await TeacherSubject.findOrCreate({
                where: { teacherId: teacherProfile.id, subjectId: subject.id },
                defaults: { teacherId: teacherProfile.id, subjectId: subject.id },
                transaction: t,
            });

            let createdQuestions = 0;

            for (const topicSeed of subjectSeed.topics) {
                const [topic] = await Topic.findOrCreate({
                    where: { title: topicSeed.title },
                    defaults: { title: topicSeed.title },
                    transaction: t,
                });

                await SubjectTopic.findOrCreate({
                    where: { subjectId: subject.id, topicId: topic.id },
                    defaults: { subjectId: subject.id, topicId: topic.id },
                    transaction: t,
                });

                for (const subtopicSeed of topicSeed.subtopics) {
                    const [subtopic] = await Subtopic.findOrCreate({
                        where: { topicId: topic.id, name: subtopicSeed.name },
                        defaults: { topicId: topic.id, name: subtopicSeed.name },
                        transaction: t,
                    });

                    for (const questionSeed of subtopicSeed.questions) {
                        const questionTypeId = questionTypeMap[questionSeed.type];
                        if (!questionTypeId) {
                            throw new Error(`No existe el tipo de pregunta ${questionSeed.type}`);
                        }

                        const payload = {
                            authorId: teacherProfile.id,
                            questionTypeId,
                            subTopicId: subtopic.id,
                            difficulty: questionSeed.difficulty,
                            body: questionSeed.body,
                            options: questionSeed.options ?? null,
                            response: questionSeed.response ?? null,
                        };

                        const [question, created] = await Question.findOrCreate({
                            where: {
                                subTopicId: subtopic.id,
                                body: questionSeed.body,
                            },
                            defaults: payload,
                            transaction: t,
                        });

                        subjectQuestionMeta.push({
                            id: question.getDataValue('id'),
                            topicId: topic.id,
                            difficulty: questionSeed.difficulty,
                        });

                        if (!created) {
                            await question.update(payload, { transaction: t });
                        } else {
                            createdQuestions += 1;
                        }
                    }
                }
            }

            questionMetaBySubjectId.set(subject.id, subjectQuestionMeta);

            subjectSummaries.push({
                name: subject.getDataValue('name'),
                topics: subjectSeed.topics.length,
                questions: createdQuestions,
            });
        }

        for (const examTemplate of examSeedData) {
            const subject = subjectsByName.get(examTemplate.subjectName);
            if (!subject) {
                examSummaries.push(`- ${examTemplate.title} (ignorado: asignatura no encontrada)`);
                continue;
            }

            const allQuestions = questionMetaBySubjectId.get(subject.id) ?? [];
            if (allQuestions.length < examTemplate.questionCount) {
                examSummaries.push(
                    `- ${examTemplate.title} (ignorado: no hay suficientes preguntas)`,
                );
                continue;
            }

            const selected: QuestionMeta[] = [];
            const seen = new Set<string>();
            const normalizedStart = examTemplate.startIndex % allQuestions.length;
            let pointer = normalizedStart;
            while (
                selected.length < examTemplate.questionCount &&
                seen.size < allQuestions.length
            ) {
                const candidate = allQuestions[pointer % allQuestions.length];
                if (!seen.has(candidate.id)) {
                    seen.add(candidate.id);
                    selected.push(candidate);
                }
                pointer += 1;
            }

            if (selected.length < examTemplate.questionCount) {
                examSummaries.push(
                    `- ${examTemplate.title} (ignorado: no se alcanzó la cantidad solicitada)`,
                );
                continue;
            }

            const topicCounts = new Map<string, number>();
            selected.forEach((meta) =>
                topicCounts.set(meta.topicId, (topicCounts.get(meta.topicId) ?? 0) + 1),
            );

            const topicProportion = Object.fromEntries(
                Array.from(topicCounts.entries()).map(([topicId, count]) => [
                    topicId,
                    Number((count / selected.length).toFixed(2)),
                ]),
            );

            const topicCoverage = {
                mode: 'manual-seed',
                subjectId: subject.id,
                difficulty: examTemplate.difficulty,
                questionIds: selected.map((item) => item.id),
                topicIds: Array.from(new Set(selected.map((item) => item.topicId))),
            };

            const teacherProfile = leadTeacherBySubjectId.get(subject.id);
            if (!teacherProfile) {
                examSummaries.push(`- ${examTemplate.title} (ignorado: sin docente asignado)`);
                continue;
            }

            const shouldValidate =
                examTemplate.examStatus === ExamStatusEnum.APPROVED ||
                examTemplate.examStatus === ExamStatusEnum.PUBLISHED;

            const examPayload = {
                title: examTemplate.title,
                subjectId: subject.id,
                difficulty: examTemplate.difficulty,
                examStatus: examTemplate.examStatus,
                authorId: teacherProfile.id,
                validatorId: shouldValidate ? teacherProfile.id : null,
                observations: 'Evaluación cargada desde seed automatizado',
                questionCount: selected.length,
                topicProportion,
                topicCoverage,
                validatedAt: shouldValidate ? new Date() : null,
            };

            const createdExam = await Exam.create(examPayload, { transaction: t });

            const examQuestionRows = selected.map((questionMeta, idx) => ({
                examId: createdExam.id,
                questionId: questionMeta.id,
                questionIndex: idx + 1,
                questionScore: questionScoreByDifficulty[questionMeta.difficulty] ?? 1,
            }));
            await ExamQuestion.bulkCreate(examQuestionRows, { transaction: t });

            const examQuestions = await ExamQuestion.findAll({
                where: { examId: createdExam.id },
                transaction: t,
            });
            const questionByIndex = new Map<number, ExamQuestion>();
            examQuestions.forEach((item) => questionByIndex.set(item.questionIndex, item));

            const assignmentSpecs = assignmentSeedByExamTitle[createdExam.title] ?? [];
            if (assignmentSpecs.length > 0) {
                for (const assignmentSpec of assignmentSpecs) {
                    const studentProfile = studentsByEmail.get(assignmentSpec.studentEmail);
                    if (!studentProfile) {
                        continue;
                    }

                    const professorProfileForAssignment = assignmentSpec.professorEmail
                        ? teacherProfilesByEmail.get(assignmentSpec.professorEmail)
                        : teacherProfile;
                    if (!professorProfileForAssignment) {
                        continue;
                    }

                    const [examAssignmentRow] = await ExamAssignment.findOrCreate({
                        where: {
                            studentId: studentProfile.id,
                            examId: createdExam.id,
                            professorId: professorProfileForAssignment.id,
                        },
                        defaults: {
                            durationMinutes: assignmentSpec.durationMinutes,
                            applicationDate: assignmentSpec.applicationDate,
                            status: assignmentSpec.status,
                            grade: assignmentSpec.grade ?? null,
                        },
                        transaction: t,
                    });

                    const assignmentUpdate: Record<string, unknown> = {
                        durationMinutes: assignmentSpec.durationMinutes,
                        applicationDate: assignmentSpec.applicationDate,
                        status: assignmentSpec.status,
                    };
                    if (typeof assignmentSpec.grade !== 'undefined') {
                        assignmentUpdate.grade = assignmentSpec.grade;
                    }
                    examAssignmentRow.set(assignmentUpdate);
                    await examAssignmentRow.save({ transaction: t });

                    if (assignmentSpec.responses) {
                        for (const responseSpec of assignmentSpec.responses) {
                            const examQuestion = questionByIndex.get(responseSpec.questionIndex);
                            if (!examQuestion) {
                                continue;
                            }

                            const [responseRow] = await ExamResponse.findOrCreate({
                                where: {
                                    studentId: studentProfile.id,
                                    examQuestionId: examQuestion.id,
                                },
                                defaults: {
                                    examId: createdExam.id,
                                    selectedOptions: responseSpec.selectedOptions ?? null,
                                    textAnswer: responseSpec.textAnswer ?? null,
                                    autoPoints: responseSpec.autoPoints ?? null,
                                    manualPoints:
                                        typeof responseSpec.manualPoints !== 'undefined'
                                            ? responseSpec.manualPoints
                                            : null,
                                    answeredAt: responseSpec.answeredAt,
                                },
                                transaction: t,
                            });

                            responseRow.set({
                                examId: createdExam.id,
                                selectedOptions: responseSpec.selectedOptions ?? null,
                                textAnswer: responseSpec.textAnswer ?? null,
                                autoPoints: responseSpec.autoPoints ?? null,
                                manualPoints:
                                    typeof responseSpec.manualPoints !== 'undefined'
                                        ? responseSpec.manualPoints
                                        : null,
                                answeredAt: responseSpec.answeredAt,
                            });
                            await responseRow.save({ transaction: t });
                        }
                    }

                    if (assignmentSpec.regrade) {
                        const reviewerProfile = assignmentSpec.regrade.reviewerEmail
                            ? teacherProfilesByEmail.get(assignmentSpec.regrade.reviewerEmail)
                            : professorProfileForAssignment;
                        const reviewerId = reviewerProfile?.id ?? professorProfileForAssignment.id;

                        const [regradeRow] = await ExamRegrade.findOrCreate({
                            where: {
                                studentId: studentProfile.id,
                                examId: createdExam.id,
                                professorId: reviewerId,
                                reason: assignmentSpec.regrade.reason,
                            },
                            defaults: {
                                status: assignmentSpec.regrade.status,
                                requestedAt: assignmentSpec.regrade.requestedAt,
                                resolvedAt: assignmentSpec.regrade.resolvedAt,
                                finalGrade: assignmentSpec.regrade.finalGrade,
                            },
                            transaction: t,
                        });

                        regradeRow.set({
                            status: assignmentSpec.regrade.status,
                            requestedAt: assignmentSpec.regrade.requestedAt,
                            resolvedAt: assignmentSpec.regrade.resolvedAt,
                            finalGrade: assignmentSpec.regrade.finalGrade,
                            reason: assignmentSpec.regrade.reason,
                        });
                        await regradeRow.save({ transaction: t });
                    }
                }
            }

            examSummaries.push(
                `- ${createdExam.title} (${createdExam.examStatus}) · ${selected.length} preguntas · materia ${examTemplate.subjectName}`,
            );
        }

        await t.commit();
        console.log('Seed completado con éxito.');
        console.log('Usuario admin -> email: admin@gmail.com | password: 123456789C');
        console.log('Profesores -> password: profesor123');
        console.log('Estudiantes -> password: estudiante123');
        subjectSummaries.forEach((summary) => {
            console.log(
                `- ${summary.name}: ${summary.topics} temas, ${summary.questions} nuevas preguntas`,
            );
        });
        if (examSummaries.length) {
            console.log('Exámenes generados:');
            examSummaries.forEach((summary) => console.log(summary));
        }
    } catch (err) {
        await t.rollback();
        console.error('Seed falló:', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();