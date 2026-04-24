import { writeFileSync } from 'fs';

const useLessons = `import { useApi } from './useApi';
import { mapLesson, createLesson, updateLesson, updateLessonStatus, deleteLesson } from '@/api/lessons';
import type { RawLesson } from '@/api/lessons';

export { createLesson, updateLesson, updateLessonStatus, deleteLesson, mapLesson };

export function useLessons(params?: {
  from?: string;
  to?: string;
  studentId?: string;
}, options?: { skip?: boolean }) {
  const studentId = params?.studentId;
  const hasInvalidStudent = studentId === '__no-student__' || studentId === '';
  const result = useApi<RawLesson[]>('/lessons', {
    from: params?.from,
    to: params?.to,
    studentId: hasInvalidStudent ? undefined : studentId,
  }, { skip: options?.skip || hasInvalidStudent });

  return {
    ...result,
    data: result.data?.map(mapLesson),
  };
}

export function useLesson(id: string | undefined) {
  const result = useApi<RawLesson>(id ? \`/lessons/\${id}\` : null);
  return {
    ...result,
    data: result.data ? mapLesson(result.data) : undefined,
  };
}
`;

writeFileSync(
  'c:/projects/dev/repeto/app/frontend-gravity/hooks/useLessons.ts',
  useLessons,
  'utf8',
);
console.log('useLessons.ts written');
