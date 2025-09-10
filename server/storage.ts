import { type Subject, type InsertSubject, type Task, type InsertTask, type UserPreferences, type InsertUserPreferences } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Subjects
  getSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: string): Promise<boolean>;

  // Tasks
  getTasks(filters?: { subjectId?: string; status?: string; priority?: number }): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]>;

  // User Preferences
  getUserPreferences(): Promise<UserPreferences | undefined>;
  updateUserPreferences(preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;
}

export class MemStorage implements IStorage {
  private subjects: Map<string, Subject>;
  private tasks: Map<string, Task>;
  private userPreferences: UserPreferences | undefined;

  constructor() {
    this.subjects = new Map();
    this.tasks = new Map();
    
    // Initialize with some default subjects
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const defaultSubjects: Subject[] = [
      { id: randomUUID(), name: "Mathematics", color: "#ef4444", createdAt: new Date() },
      { id: randomUUID(), name: "Physics", color: "#3b82f6", createdAt: new Date() },
      { id: randomUUID(), name: "Chemistry", color: "#10b981", createdAt: new Date() },
      { id: randomUUID(), name: "Literature", color: "#8b5cf6", createdAt: new Date() },
    ];

    defaultSubjects.forEach(subject => {
      this.subjects.set(subject.id, subject);
    });

    // Initialize user preferences
    this.userPreferences = {
      id: randomUUID(),
      googleCalendarConnected: false,
      googleAccessToken: null,
      googleRefreshToken: null,
      notificationsEnabled: true,
      studyStreak: 7,
      lastStudyDate: new Date(),
    };
  }

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = randomUUID();
    const subject: Subject = {
      ...insertSubject,
      id,
      createdAt: new Date(),
    };
    this.subjects.set(id, subject);
    return subject;
  }

  async updateSubject(id: string, updateData: Partial<InsertSubject>): Promise<Subject | undefined> {
    const existing = this.subjects.get(id);
    if (!existing) return undefined;

    const updated: Subject = { ...existing, ...updateData };
    this.subjects.set(id, updated);
    return updated;
  }

  async deleteSubject(id: string): Promise<boolean> {
    return this.subjects.delete(id);
  }

  // Tasks
  async getTasks(filters?: { subjectId?: string; status?: string; priority?: number }): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());

    if (filters?.subjectId) {
      tasks = tasks.filter(task => task.subjectId === filters.subjectId);
    }
    if (filters?.status) {
      tasks = tasks.filter(task => task.status === filters.status);
    }
    if (filters?.priority) {
      tasks = tasks.filter(task => task.priority === filters.priority);
    }

    return tasks.sort((a, b) => {
      // Sort by priority (high to low), then by due date
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    });
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const now = new Date();
    const task: Task = {
      ...insertTask,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;

    const updated: Task = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => {
      if (!task.dueDate) return false;
      return task.dueDate >= startDate && task.dueDate <= endDate;
    });
  }

  // User Preferences
  async getUserPreferences(): Promise<UserPreferences | undefined> {
    return this.userPreferences;
  }

  async updateUserPreferences(updateData: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    if (!this.userPreferences) {
      this.userPreferences = {
        id: randomUUID(),
        googleCalendarConnected: false,
        googleAccessToken: null,
        googleRefreshToken: null,
        notificationsEnabled: true,
        studyStreak: 0,
        lastStudyDate: null,
        ...updateData,
      };
    } else {
      this.userPreferences = { ...this.userPreferences, ...updateData };
    }
    return this.userPreferences;
  }
}

export const storage = new MemStorage();
