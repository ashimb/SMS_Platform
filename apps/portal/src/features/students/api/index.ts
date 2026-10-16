/**
 * Students data access (TanStack Query over the typed API client). The reference pattern for
 * other features: query-key factory, list/detail queries, mutations that keep the cache in sync.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@/lib/api.ts";
import { api } from "@/lib/auth-store.ts";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/session.ts";

import { SEARCH_MIN_LENGTH } from "../schemas.ts";
import type { Student, StudentCreateBody, StudentListParams, StudentUpdateBody } from "../types.ts";

export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (params: StudentListParams) => [...studentKeys.lists(), params] as const,
  detail: (id: string) => [...studentKeys.all, "detail", id] as const,
};

export function fetchStudents(params: StudentListParams, pageSize = DEFAULT_PAGE_SIZE) {
  const q = params.q.trim();
  return unwrap(
    api.GET("/api/v1/students", {
      params: {
        query: {
          page: params.page,
          page_size: pageSize,
          // The API requires 2+ characters; shorter input means "no search".
          ...(q.length >= SEARCH_MIN_LENGTH ? { q } : {}),
          ...(params.status ? { status: params.status } : {}),
        },
      },
    }),
  );
}

export function useStudents(params: StudentListParams) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: () => fetchStudents(params),
    // Keep the current page on screen while the next one loads (no flash of skeletons).
    placeholderData: keepPreviousData,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () =>
      unwrap(api.GET("/api/v1/students/{student_id}", { params: { path: { student_id: id } } })),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: StudentCreateBody) => unwrap(api.POST("/api/v1/students", { body })),
    onSuccess: (student: Student) => {
      queryClient.setQueryData(studentKeys.detail(student.id), student);
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: StudentUpdateBody) =>
      unwrap(
        api.PATCH("/api/v1/students/{student_id}", { params: { path: { student_id: id } }, body }),
      ),
    onSuccess: (student: Student) => {
      queryClient.setQueryData(studentKeys.detail(student.id), student);
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}
