import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task } from "@shared/schema";

interface CalendarWidgetProps {
  tasks: Task[];
}

export default function CalendarWidget({ tasks }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return format(new Date(task.dueDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  const getUpcomingDeadlines = () => {
    const now = new Date();
    const upcomingTasks = tasks
      .filter(task => {
        if (!task.dueDate || task.status === "completed") return false;
        return new Date(task.dueDate) > now;
      })
      .sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 3);

    return upcomingTasks;
  };

  const formatDeadlineDate = (dueDate: Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffInHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `Tomorrow, ${format(due, 'h:mm a')}`;
    } else {
      return format(due, 'MMM d, h:mm a');
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return "bg-destructive";
      case 2: return "bg-accent";
      default: return "bg-secondary";
    }
  };

  const studyStreak = 7; // This would come from user preferences in a real app

  return (
    <div className="space-y-6">
      {/* Mini Calendar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-foreground" data-testid="text-calendar-month">
            {format(currentDate, 'MMMM yyyy')}
          </h4>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              data-testid="button-previous-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dayTasks = getTasksForDate(day);
            const hasHighPriority = dayTasks.some(task => task.priority === 3);
            const hasTasks = dayTasks.length > 0;
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "calendar-day text-center text-sm py-2 rounded cursor-pointer relative",
                  isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground",
                  !isSameMonth(day, currentDate) && "text-muted-foreground"
                )}
                data-testid={`calendar-day-${format(day, 'd')}`}
              >
                {format(day, 'd')}
                {hasTasks && (
                  <div className={cn(
                    "absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full",
                    hasHighPriority ? "bg-destructive" : "bg-accent"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Bell className="text-accent h-4 w-4" />
          Upcoming Deadlines
        </h4>
        <div className="space-y-3">
          {getUpcomingDeadlines().map((task) => (
            <div 
              key={task.id} 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
              data-testid={`deadline-${task.id}`}
            >
              <div className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {task.dueDate && formatDeadlineDate(task.dueDate)}
                </p>
              </div>
            </div>
          ))}
          
          {getUpcomingDeadlines().length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
            </div>
          )}
        </div>
      </div>

      {/* Study Streak */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-border rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-foreground mb-1" data-testid="text-study-streak">
            {studyStreak}
          </div>
          <p className="text-sm text-primary-foreground/70">Day Study Streak!</p>
          <div className="flex justify-center gap-1 mt-3">
            {Array.from({ length: 7 }, (_, i) => (
              <div 
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full",
                  i < studyStreak ? "bg-primary" : "bg-primary/30"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-primary-foreground/70 mt-2">Keep it up! 🌟</p>
        </div>
      </div>
    </div>
  );
}
