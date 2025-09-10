import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, insertSubjectSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const { subjectId, status, priority } = req.query;
      const filters: any = {};
      
      if (subjectId) filters.subjectId = subjectId as string;
      if (status) filters.status = status as string;
      if (priority) filters.priority = parseInt(priority as string);

      const tasks = await storage.getTasks(filters);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const updates = req.body;
      const task = await storage.updateTask(req.params.id, updates);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Subject routes
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.post("/api/subjects", async (req, res) => {
    try {
      const subjectData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(subjectData);
      res.status(201).json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subject data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  // User preferences routes
  app.get("/api/preferences", async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences();
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.patch("/api/preferences", async (req, res) => {
    try {
      const preferences = await storage.updateUserPreferences(req.body);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Google Calendar webhook endpoint
  app.post("/api/google-calendar/webhook", async (req, res) => {
    try {
      const channelId = req.headers['x-goog-channel-id'];
      const resourceState = req.headers['x-goog-resource-state'];
      
      console.log('Google Calendar webhook received:', {
        channelId,
        resourceState,
        body: req.body
      });

      // Handle sync message
      if (resourceState === 'sync') {
        return res.status(200).send('OK');
      }

      // TODO: Implement calendar event synchronization
      // When events change, fetch updated events and sync with tasks
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('Google Calendar webhook error:', error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Google Calendar OAuth routes
  app.post("/api/google-calendar/connect", async (req, res) => {
    try {
      const { accessToken, refreshToken } = req.body;
      
      const preferences = await storage.updateUserPreferences({
        googleCalendarConnected: true,
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
      });
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to connect Google Calendar" });
    }
  });

  app.post("/api/google-calendar/disconnect", async (req, res) => {
    try {
      const preferences = await storage.updateUserPreferences({
        googleCalendarConnected: false,
        googleAccessToken: null,
        googleRefreshToken: null,
      });
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect Google Calendar" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
