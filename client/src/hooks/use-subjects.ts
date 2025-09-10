import { useQuery } from "@tanstack/react-query";
import type { Subject } from "@shared/schema";

export function useSubjects() {
  return useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const response = await fetch("/api/subjects");
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      return response.json();
    },
  });
}

export function useSubject(subjectId: string) {
  return useQuery<Subject>({
    queryKey: ["/api/subjects", subjectId],
    queryFn: async () => {
      const response = await fetch(`/api/subjects/${subjectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subject');
      }
      return response.json();
    },
    enabled: !!subjectId,
  });
}
