// import { CreateTeacherCommand } from "../../../domains/user/application/commands/createTeacher";
// import { DeleteTeacherCommand } from "../../../domains/user/application/commands/deleteTeacher";
// import { UpdateTeacherCommand } from "../../../domains/user/application/commands/updateTeacher";
// import { GetTeacherByIdQuery } from "../../../domains/user/application/queries/GetTeacherByIdQuery";
// import { ListTeachersQuery } from "../../../domains/user/application/queries/ListTeacherQuery";
// import { TeacherService } from "../../../domains/user/domain/services/userService";
// import Teacher from "../../../infrastructure/user/models/Teacher";
// import { TeacherRepository } from "../../../infrastructure/user/repositories/TeacherRepository";

// let _repo: TeacherRepository | null = null;
// let _svc: TeacherService | null = null;
// let _qList: ListTeachersQuery | null = null;
// let _qGetById: GetTeacherByIdQuery | null = null;
// let _cCreate: CreateTeacherCommand | null = null;
// let _cUpdate: UpdateTeacherCommand | null = null;
// let _cDelete: DeleteTeacherCommand | null = null;

// //Repository
// export function makeTeacherRepository() {
//   if (_repo) return _repo;
//   _repo = new TeacherRepository(Teacher);
//   return _repo;
// }

// //Service
// export function makeTeacherService() {
//   if (_svc) return _svc;
//   _svc = new TeacherService({
//     repo: makeTeacherRepository(),
//   });
//   return _svc;
// } 

// //Queries
// export function makeListTeachersQuery() {
//   if (_qList) return _qList;
//   _qList = new ListTeachersQuery(makeTeacherService());
//   return _qList;
// }

// export function makeGetTeacherByIdQuery() {
//   if (_qGetById) return _qGetById;
//   _qGetById = new GetTeacherByIdQuery(makeTeacherService());
//   return _qGetById;
// }

// //Commands
// export function makeCreateTeacherCommand() {
//   if (_cCreate) return _cCreate;
//   // Create suele necesitar reglas (hash, validaciones), por eso inyectamos el service
//   _cCreate = new CreateTeacherCommand(makeTeacherRepository(), makeTeacherService());
//   return _cCreate;
// }

// export function makeUpdateTeacherCommand() {
//   if (_cUpdate) return _cUpdate;
//   // Si Update tiene reglas (normalización, hash condicional), usa el service:
//   // _cUpdate = new UpdateTeacherCommand(makeTeacherService());
//   // Si es patch simple, repo basta:
//   _cUpdate = new UpdateTeacherCommand(makeTeacherRepository());
//   return _cUpdate;
// }

// export function makeDeleteTeacherCommand() {
//   if (_cDelete) return _cDelete;
//   _cDelete = new DeleteTeacherCommand(makeTeacherRepository());
//   return _cDelete;
// }
