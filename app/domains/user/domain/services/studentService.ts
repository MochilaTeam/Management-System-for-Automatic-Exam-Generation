import { IStudentRepository } from "../ports/IStudentRepository";
import { IUserRepository } from "../ports/IUserRepository";
import {
  type StudentRead,
  type ListStudents,
  type ListStudentsResponse,
} from "../../schemas/studentSchema";

type Deps = {
  studentRepo: IStudentRepository;
  userRepo: IUserRepository;
};

export class StudentService {
  constructor(private readonly deps: Deps) {}

 //crea el perfil de student para un user creado
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
