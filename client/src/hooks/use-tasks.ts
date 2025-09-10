import { useQuery } from "@tanstack/react-query";
import type { Task } from "@shared/schema";

export function useTasks(filters?: { subjectId?: string; status?: string; priority?: number }) {
  const params = new URLSearchParams();
  if (filters?.subjectId) params.append('subjectId', filters.subjectId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority.toString());

  const queryString = params.toString();
  const url = `/api/tasks${queryString ? `?${queryString}` : ''}`;

  return useQuery<Task[]>({
    queryKey: ["/api/tasks", filters],
    queryFn: async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    },
  });
}

export function useTask(taskId: string) {
  return useQuery<Task>({
    queryKey: ["/api/tasks", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch task');
      }
      return response.json();
    },
    enabled: !!taskId,
  });
}
