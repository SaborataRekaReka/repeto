import { useApi } from './useApi';
import {
  mapStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  activateStudentAccount,
  unlinkStudentAccount,
  checkStudentEmail,
  createNote,
  deleteNote,
  updateNote,
  createHomework,
  updateHomework,
  deleteHomework,
} from '@/api/students';
import type { RawStudent } from '@/api/students';

export {
  mapStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  activateStudentAccount,
  unlinkStudentAccount,
  checkStudentEmail,
  createNote,
  deleteNote,
  updateNote,
  createHomework,
  updateHomework,
  deleteHomework,
};

type StudentsResponse = {
  data: RawStudent[];
  total: number;
  page: number;
  pages: number;
};

export function useStudents(params?: {
  status?: string;
  search?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}, options?: { skip?: boolean }) {
  const result = useApi<StudentsResponse>('/students', {
    status: params?.status?.toUpperCase(),
    search: params?.search,
    sort: params?.sort,
    order: params?.order,
    page: params?.page,
    limit: params?.limit,
  }, {
    skip: options?.skip,
  });

  return {
    ...result,
    data: result.data
      ? {
          ...result.data,
          data: result.data.data.map(mapStudent),
        }
      : undefined,
  };
}

export function useStudent(id: string | undefined) {
  const result = useApi<RawStudent>(id ? `/students/${id}` : null);
  return {
    ...result,
    data: result.data ? mapStudent(result.data) : undefined,
  };
}

// ── Notes ──

export function useStudentNotes(studentId: string | undefined) {
  return useApi<{ data: unknown[]; total: number }>(
    studentId ? `/students/${studentId}/notes` : null,
    { limit: 100 },
  );
}

// ── Homework ──

export function useStudentHomework(studentId: string | undefined) {
  return useApi<{ data: unknown[]; total: number }>(
    studentId ? `/students/${studentId}/homework` : null,
    { limit: 100 },
  );
}
