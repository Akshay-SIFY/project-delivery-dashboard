"use client"

import { create } from "zustand"
import type { Project, Task, TeamMember } from "./types"

// Helper function to generate URL-friendly slug from project name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

interface Store {
  projects: Project[]
  tasks: Task[]
  teamMembers: TeamMember[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  addProject: (project: Omit<Project, "id" | "slug" | "createdAt" | "tasksCount" | "completedTasks" | "progress">) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  getProjectBySlug: (slug: string) => Project | undefined
  addTask: (task: Omit<Task, "id" | "createdAt">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  addTeamMember: (member: Omit<TeamMember, "id">) => void
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void
  deleteTeamMember: (id: string) => { deletedMember: TeamMember; affectedTasks: Task[] }
  getTasksByAssignee: (memberName: string) => Task[]
}

const teamMembers: TeamMember[] = [
  { id: "1", name: "Sant Prasad Gupta", avatar: "SP", role: "Manager" },
  { id: "2", name: "Akshay Singh", avatar: "AS", role: "Content Specialist" },
  { id: "3", name: "Ajhar", avatar: "AJ", role: "Associate" },
  { id: "4", name: "Dharmendra", avatar: "DH", role: "Associate" },
  { id: "5", name: "Rohit", avatar: "RH", role: "Customer Front" },
  { id: "6", name: "Tech Team", avatar: "TT", role: "Tech" },
  { id: "7", name: "Backend Team", avatar: "BT", role: "Backend" },
]

const initialProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    slug: "website-redesign",
    description: "Complete overhaul of the company website with modern design and improved UX",
    status: "active",
    progress: 65,
    tasksCount: 12,
    completedTasks: 8,
    dueDate: "2026-05-15",
    createdAt: "2026-01-15",
    color: "oklch(0.55 0.15 195)",
  },
  {
    id: "2",
    name: "Mobile App Development",
    slug: "mobile-app-development",
    description: "Build a cross-platform mobile application for iOS and Android",
    status: "active",
    progress: 40,
    tasksCount: 20,
    completedTasks: 8,
    dueDate: "2026-06-30",
    createdAt: "2026-02-01",
    color: "oklch(0.65 0.15 145)",
  },
  {
    id: "3",
    name: "API Integration",
    slug: "api-integration",
    description: "Integrate third-party APIs for payment processing and analytics",
    status: "on-hold",
    progress: 25,
    tasksCount: 8,
    completedTasks: 2,
    dueDate: "2026-04-20",
    createdAt: "2026-03-01",
    color: "oklch(0.6 0.18 45)",
  },
  {
    id: "4",
    name: "Database Migration",
    slug: "database-migration",
    description: "Migrate legacy database to new cloud infrastructure",
    status: "completed",
    progress: 100,
    tasksCount: 6,
    completedTasks: 6,
    dueDate: "2026-03-30",
    createdAt: "2026-02-15",
    color: "oklch(0.55 0.2 25)",
  },
]

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Design homepage mockup",
    description: "Create high-fidelity mockups for the new homepage design",
    priority: "high",
    status: "completed",
    assignees: ["Akshay Singh"],
    dependencies: [],
    startDate: "2026-03-20",
    dueDate: "2026-04-10",
    projectId: "1",
    createdAt: "2026-03-15",
  },
  {
    id: "2",
    title: "Implement responsive navigation",
    description: "Build a responsive navigation component that works on all devices",
    priority: "high",
    status: "in-progress",
    assignees: ["Sant Prasad Gupta"],
    dependencies: ["1"],
    startDate: "2026-03-25",
    dueDate: "2026-04-15",
    projectId: "1",
    createdAt: "2026-03-20",
  },
  {
    id: "3",
    title: "Set up CI/CD pipeline",
    description: "Configure automated testing and deployment pipeline",
    priority: "medium",
    status: "todo",
    assignees: ["Tech Team"],
    dependencies: ["2"],
    startDate: "2026-04-01",
    dueDate: "2026-04-20",
    projectId: "1",
    createdAt: "2026-03-25",
  },
  {
    id: "4",
    title: "User authentication flow",
    description: "Implement secure user login and registration",
    priority: "high",
    status: "in-progress",
    assignees: ["Backend Team"],
    dependencies: [],
    startDate: "2026-03-15",
    dueDate: "2026-04-25",
    projectId: "2",
    createdAt: "2026-03-10",
  },
  {
    id: "5",
    title: "Push notifications",
    description: "Set up push notification service for mobile app",
    priority: "medium",
    status: "todo",
    assignees: ["Dharmendra"],
    dependencies: ["4"],
    startDate: "2026-04-05",
    dueDate: "2026-05-01",
    projectId: "2",
    createdAt: "2026-03-15",
  },
  {
    id: "6",
    title: "Payment gateway integration",
    description: "Integrate Stripe payment processing",
    priority: "high",
    status: "todo",
    assignees: ["Tech Team"],
    dependencies: [],
    startDate: "2026-04-01",
    dueDate: "2026-04-30",
    projectId: "3",
    createdAt: "2026-03-20",
  },
  {
    id: "7",
    title: "Analytics dashboard",
    description: "Build analytics dashboard with charts and metrics",
    priority: "low",
    status: "todo",
    assignees: ["Akshay Singh"],
    dependencies: ["6"],
    startDate: "2026-04-10",
    dueDate: "2026-05-10",
    projectId: "3",
    createdAt: "2026-03-25",
  },
  {
    id: "8",
    title: "Data backup verification",
    description: "Verify all data has been backed up correctly",
    priority: "high",
    status: "completed",
    assignees: ["Rohit"],
    dependencies: [],
    startDate: "2026-03-10",
    dueDate: "2026-03-25",
    projectId: "4",
    createdAt: "2026-03-01",
  },
]

export const useStore = create<Store>((set, get) => ({
  projects: initialProjects,
  tasks: initialTasks,
  teamMembers,
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  addProject: (project) => {
    const slug = generateSlug(project.name)
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      slug,
      createdAt: new Date().toISOString().split("T")[0],
      tasksCount: 0,
      completedTasks: 0,
      progress: 0,
    }
    set((state) => ({ projects: [...state.projects, newProject] }))
  },
  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  },
  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      tasks: state.tasks.filter((t) => t.projectId !== id),
    }))
  },
  getProjectBySlug: (slug) => {
    return get().projects.find((p) => p.slug === slug)
  },
  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split("T")[0],
    }
    set((state) => {
      const updatedTasks = [...state.tasks, newTask]
      const projectTasks = updatedTasks.filter((t) => t.projectId === task.projectId)
      const completedTasks = projectTasks.filter((t) => t.status === "completed").length
      const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
      return {
        tasks: updatedTasks,
        projects: state.projects.map((p) =>
          p.id === task.projectId
            ? { ...p, tasksCount: projectTasks.length, completedTasks, progress }
            : p
        ),
      }
    })
  },
  updateTask: (id, updates) => {
    set((state) => {
      const updatedTasks = state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
      const task = updatedTasks.find((t) => t.id === id)
      if (!task) return { tasks: updatedTasks }
      
      const projectTasks = updatedTasks.filter((t) => t.projectId === task.projectId)
      const completedTasks = projectTasks.filter((t) => t.status === "completed").length
      const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
      
      return {
        tasks: updatedTasks,
        projects: state.projects.map((p) =>
          p.id === task.projectId
            ? { ...p, completedTasks, progress }
            : p
        ),
      }
    })
  },
  deleteTask: (id) => {
    set((state) => {
      const task = state.tasks.find((t) => t.id === id)
      if (!task) return state
      
      const updatedTasks = state.tasks.filter((t) => t.id !== id)
      const projectTasks = updatedTasks.filter((t) => t.projectId === task.projectId)
      const completedTasks = projectTasks.filter((t) => t.status === "completed").length
      const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
      
      return {
        tasks: updatedTasks,
        projects: state.projects.map((p) =>
          p.id === task.projectId
            ? { ...p, tasksCount: projectTasks.length, completedTasks, progress }
            : p
        ),
      }
    })
  },
  addTeamMember: (member) => {
    const newMember: TeamMember = {
      ...member,
      id: Date.now().toString(),
    }
    set((state) => ({ teamMembers: [...state.teamMembers, newMember] }))
  },
  updateTeamMember: (id, updates) => {
    set((state) => ({
      teamMembers: state.teamMembers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }))
  },
  deleteTeamMember: (id) => {
    const state = get()
    const memberToDelete = state.teamMembers.find((m) => m.id === id)
    if (!memberToDelete) return { deletedMember: null as any, affectedTasks: [] }
    
    const affectedTasks = state.tasks.filter((t) =>
      t.assignees.includes(memberToDelete.name)
    )
    
    set((state) => ({
      teamMembers: state.teamMembers.filter((m) => m.id !== id),
      tasks: state.tasks.map((t) =>
        t.assignees.includes(memberToDelete.name)
          ? { ...t, assignees: t.assignees.filter((a) => a !== memberToDelete.name) }
          : t
      ),
    }))
    
    return { deletedMember: memberToDelete, affectedTasks }
  },
  getTasksByAssignee: (memberName) => {
    return get().tasks.filter((t) => t.assignees.includes(memberName))
  },
}))
