import { useState } from "react";
import Sidebar from "@/components/sidebar";
import TaskCard from "@/components/task-card";
import CalendarWidget from "@/components/calendar-widget";
import CreateTaskDialog from "@/components/create-task-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/use-tasks";
import { useSubjects } from "@/hooks/use-subjects";
import { Search, Plus, Filter } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: subjects = [] } = useSubjects();

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = !selectedSubjectId || task.subjectId === selectedSubjectId;
    
    return matchesSearch && matchesSubject;
  });

  // Separate tasks by priority and status
  const highPriorityTasks = filteredTasks.filter(task => 
    task.priority === 3 && task.status !== "completed"
  );
  
  const regularTasks = filteredTasks.filter(task => 
    task.priority < 3 && task.status !== "completed"
  );

  const completedTasks = filteredTasks.filter(task => task.status === "completed");

  // Calculate stats
  const todaysTasks = filteredTasks.filter(task => {
    if (!task.dueDate) return false;
    return format(new Date(task.dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  });

  return (
    <div className="flex h-screen gradient-bg">
      <Sidebar 
        subjects={subjects}
        selectedSubjectId={selectedSubjectId}
        onSubjectSelect={setSelectedSubjectId}
        tasksToday={todaysTasks.length}
        completedToday={completedTasks.length}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="font-display font-semibold text-xl text-foreground">
                This {viewMode === "week" ? "Week" : "Month"}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                  data-testid="button-week-view"
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                  data-testid="button-month-view"
                >
                  Month
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search"
                />
              </div>
              
              {/* User Avatar */}
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">JS</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tasks Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg text-foreground">
                  Today's Tasks
                </h3>
                <Button
                  className="floating-button"
                  size="sm"
                  onClick={() => setIsCreateTaskOpen(true)}
                  data-testid="button-create-task"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>

              {/* High Priority Tasks */}
              {highPriorityTasks.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="text-destructive">⚠️</span>
                    High Priority
                  </h4>
                  <div className="space-y-3">
                    {highPriorityTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        subjects={subjects}
                        data-testid={`task-card-${task.id}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Tasks */}
              {regularTasks.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Regular Tasks
                  </h4>
                  <div className="space-y-3">
                    {regularTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        subjects={subjects}
                        data-testid={`task-card-${task.id}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Completed Tasks
                  </h4>
                  <div className="space-y-3">
                    {completedTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        subjects={subjects}
                        data-testid={`task-card-completed-${task.id}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredTasks.length === 0 && !tasksLoading && (
                <div className="text-center py-12">
                  <div className="text-muted-foreground text-lg mb-2">No tasks found</div>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubjectId 
                      ? "No tasks for the selected subject" 
                      : "Create your first task to get started"
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Calendar Widget */}
            <CalendarWidget tasks={filteredTasks} />
          </div>
        </main>
      </div>

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        subjects={subjects}
      />
    </div>
  );
}
