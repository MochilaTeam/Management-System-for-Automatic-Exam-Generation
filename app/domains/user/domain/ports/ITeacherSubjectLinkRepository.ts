export type TeacherSubjectAssignments = {
    leadSubjectIds: string[];
    leadSubjectNames: string[];
    teachingSubjectIds: string[];
    teachingSubjectNames: string[];
};

export interface ITeacherSubjectLinkRepository {
    findMissingSubjectIds(subjectIds: string[]): Promise<string[]>;
    syncTeachingSubjects(teacherId: string, subjectIds: string[]): Promise<void>;
    syncLeadSubjects(teacherId: string, subjectIds: string[]): Promise<void>;
    getAssignments(teacherId: string): Promise<TeacherSubjectAssignments>;
    getAssignmentsForTeachers(
        teacherIds: string[],
    ): Promise<Map<string, TeacherSubjectAssignments>>;
}
