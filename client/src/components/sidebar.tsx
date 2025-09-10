import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Home, CheckSquare, Calendar, TrendingUp, Filter, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Subject } from "@shared/schema";

interface SidebarProps {
  subjects: Subject[];
  selectedSubjectId: string | null;
  onSubjectSelect: (subjectId: string | null) => void;
  tasksToday: number;
  completedToday: number;
}

export default function Sidebar({ 
  subjects, 
  selectedSubjectId, 
  onSubjectSelect,
  tasksToday,
  completedToday 
}: SidebarProps) {
  const [activeNav, setActiveNav] = useState("dashboard");

  const getSubjectColor = (color: string) => {
    // Map hex colors to HSL for consistency
    const colorMap: Record<string, string> = {
      "#ef4444": "0, 75%, 55%", // red
      "#3b82f6": "220, 75%, 55%", // blue  
      "#10b981": "160, 75%, 55%", // green
      "#8b5cf6": "260, 75%, 55%", // purple
    };
    return colorMap[color] || "0, 0%, 50%";
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, active: true },
    { id: "tasks", label: "My Tasks", icon: CheckSquare },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "progress", label: "Progress", icon: TrendingUp },
  ];

  return (
    <div className="w-80 bg-card border-r border-border p-6 overflow-y-auto">
      {/* Logo and Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <GraduationCap className="text-primary-foreground h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display font-semibold text-lg text-foreground">StudyPlan</h1>
          <p className="text-sm text-muted-foreground">Smart planning made cute</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-primary/20 rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-primary-foreground" data-testid="stats-today">
            {tasksToday}
          </div>
          <div className="text-xs text-primary-foreground/70">Today's Tasks</div>
        </div>
        <div className="bg-secondary/20 rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-secondary-foreground" data-testid="stats-completed">
            {completedToday}
          </div>
          <div className="text-xs text-secondary-foreground/70">Completed</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 mb-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 px-3 py-2",
                isActive && "bg-primary/10 text-primary-foreground hover:bg-primary/10"
              )}
              onClick={() => setActiveNav(item.id)}
              data-testid={`nav-${item.id}`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{item.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Subject Filters */}
      <div className="mb-6">
        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Subjects
        </h3>
        
        {/* All Subjects */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between p-2 mb-2",
            selectedSubjectId === null && "bg-muted"
          )}
          onClick={() => onSubjectSelect(null)}
          data-testid="filter-all-subjects"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span className="text-sm">All Subjects</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {subjects.length}
          </Badge>
        </Button>

        {/* Individual Subjects */}
        <div className="space-y-2">
          {subjects.map((subject) => (
            <Button
              key={subject.id}
              variant="ghost"
              className={cn(
                "w-full justify-between p-2",
                selectedSubjectId === subject.id && "bg-muted"
              )}
              onClick={() => onSubjectSelect(subject.id)}
              data-testid={`filter-subject-${subject.id}`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: `hsl(${getSubjectColor(subject.color)})`
                  }}
                />
                <span className="text-sm">{subject.name}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                0
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Google Calendar Integration */}
      <div className="bg-secondary/10 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-green-500" />
          <span className="font-medium text-secondary-foreground">Google Calendar</span>
        </div>
        <p className="text-xs text-secondary-foreground/70 mb-3">
          Sync your tasks and get notifications
        </p>
        <Button 
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
          size="sm"
          data-testid="button-connect-calendar"
        >
          <Link className="h-4 w-4 mr-2" />
          Connect Calendar
        </Button>
      </div>
    </div>
  );
}
