import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, Circle, CheckCircle, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Task, Subject } from "@shared/schema";

interface TaskCardProps {
  task: Task;
  subjects: Subject[];
  "data-testid"?: string;
}

export default function TaskCard({ task, subjects, "data-testid": testId }: TaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const queryClient = useQueryClient();

  const subject = subjects.find(s => s.id === task.subjectId);

  const toggleCompleteMutation = useMutation({
    mutationFn: async () => {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      return apiRequest("PATCH", `/api/tasks/${task.id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompleting(true);
    try {
      await toggleCompleteMutation.mutateAsync();
    } finally {
      setIsCompleting(false);
    }
  };

  const getPriorityStars = (priority: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-3 h-3",
          i < priority ? "text-accent fill-current" : "text-muted-foreground"
        )}
      />
    ));
  };

  const getSubjectTagStyle = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      "#ef4444": { bg: "bg-red-100", text: "text-red-800" },
      "#3b82f6": { bg: "bg-blue-100", text: "text-blue-800" },
      "#10b981": { bg: "bg-green-100", text: "text-green-800" },
      "#8b5cf6": { bg: "bg-purple-100", text: "text-purple-800" },
    };
    return colorMap[color] || { bg: "bg-gray-100", text: "text-gray-800" };
  };

  const formatDueDate = (dueDate: Date | null) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffInHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24 && diffInHours > 0) {
      return `Due ${format(due, 'h:mm a')}`;
    } else if (diffInHours < 0) {
      return "Overdue";
    } else {
      return `Due ${format(due, 'MMM d, h:mm a')}`;
    }
  };

  const tagStyle = subject ? getSubjectTagStyle(subject.color) : { bg: "bg-gray-100", text: "text-gray-800" };
  const isCompleted = task.status === "completed";

  return (
    <div 
      className={cn(
        "task-card bg-card border border-border rounded-lg p-4 cursor-pointer",
        isCompleted && "opacity-60"
      )}
      data-testid={testId}
    >
      <div className="flex items-start justify-between mb-2">
        <h5 className={cn(
          "font-medium text-foreground flex-1 mr-2",
          isCompleted && "line-through"
        )}>
          {task.title}
        </h5>
        <div className="flex items-center gap-2">
          {subject && (
            <Badge 
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                tagStyle.bg,
                tagStyle.text
              )}
              data-testid={`badge-subject-${subject.name.toLowerCase()}`}
            >
              {subject.name}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-6 w-6"
            onClick={handleToggleComplete}
            disabled={isCompleting}
            data-testid={`button-toggle-complete-${task.id}`}
          >
            {isCompleted ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-sm text-muted-foreground mb-3" data-testid={`text-description-${task.id}`}>
          {task.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span data-testid={`text-due-date-${task.id}`}>
            {formatDueDate(task.dueDate) || "No due date"}
          </span>
        </div>
        <div className="flex items-center gap-1" data-testid={`priority-stars-${task.id}`}>
          {getPriorityStars(task.priority)}
        </div>
      </div>
    </div>
  );
}
