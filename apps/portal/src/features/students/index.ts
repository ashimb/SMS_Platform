/**
 * Students: the reference feature (list with server pagination/search/filters, detail,
 * create/edit). Other features follow the same api/ · components/ · pages/ · schemas · types shape.
 */
export {
  fetchStudents,
  studentKeys,
  useCreateStudent,
  useStudent,
  useStudents,
  useUpdateStudent,
} from "./api/index.ts";
export { classLabel, fullName, StudentStatusBadge } from "./components/StudentStatusBadge.tsx";
export {
  parseListParams,
  studentCreateSchema,
  studentEditFormSchema,
  studentUpdateSchema,
  toSearchParams,
} from "./schemas.ts";
export type { Student, StudentListParams, StudentStatus } from "./types.ts";
