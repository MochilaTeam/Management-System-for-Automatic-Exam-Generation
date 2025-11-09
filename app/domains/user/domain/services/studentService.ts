import { IStudentRepository } from "../ports/IStudentRepository";
import { IUserRepository } from "../ports/IUserRepository";
import {type StudentRead,type ListStudents,type ListStudentsResponse} from "../../schemas/studentSchema";
import { ListStudentsCriteria } from "../ports/IStudentRepository";

type Deps = {
  studentRepo: IStudentRepository;
  userRepo: IUserRepository;
};

export class StudentService {
  constructor(private readonly deps: Deps) {}

  async createProfile(input: { userId: string; age: number; course: number }): Promise<StudentRead> {
    const user = await this.deps.userRepo.get_by_id(input.userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    const duplicated = await this.deps.studentRepo.existsBy({ userId: input.userId });
    if (duplicated) throw new Error("STUDENT_ALREADY_EXISTS_FOR_USER");
    const created = await this.deps.studentRepo.createProfile({
      userId: input.userId,
      age: input.age,
      course: input.course,
    });

    return created; 
  }

  async getById(id: string): Promise<StudentRead | null> {
    return this.deps.studentRepo.get_by_id(id);
  }

  async paginate(criteria: ListStudents): Promise<ListStudentsResponse> {
    const limit = criteria.limit ?? 20;
    const offset = criteria.offset ?? 0;
    const repoCriteria: ListStudentsCriteria = {
      limit,
      offset,
      filters: {
        userId: criteria.userId,
        role: criteria.role,
        active: criteria.active,
        filter: criteria.filter,
        email: criteria.email,
      },
    };
    const { items, total } = await this.deps.studentRepo.paginate(repoCriteria);
    return {
      data: items,
      meta: { limit, offset, total },
    };
  }

  //update al perfil de student
  async updateProfile(
    id: string,
    patch: Partial<{ age: number; course: number }>
  ): Promise<StudentRead | null> {
    const updated = await this.deps.studentRepo.updateProfile(id, patch);
    return updated; 
  }

  async deleteById(id: string): Promise<boolean> {
    return this.deps.studentRepo.deleteById(id);
  }
}
