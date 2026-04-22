"use client"

import { create } from "zustand"
import type { Project, Task, TeamMember } from "./types"

interface Store {
  projects: Project[]
  tasks: Task[]
  teamMembers: TeamMember[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  addProject: (
    project: Omit<
      Project,
      "id" | "slug" | "createdAt" | "tasksCount" | "completedTasks" | "progress"
    >,
  ) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  getProjectBySlug: (slug: string) => Project | undefined
  addTask: (task: Omit<Task, "id" | "createdAt">) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  addTeamMember: (member: Omit<TeamMember, "id">) => Promise<void>
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>
  deleteTeamMember: (id: string) => Promise<{ deletedMember: TeamMember | null; affectedTasks: Task[] }>
  getTasksByAssignee: (memberName: string) => Task[]
  loadProjects: () => Promise<void>
  loadTasks: () => Promise<void>
  loadTeamMembers: () => Promise<void>
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}

export const useStore = create<Store>((set, get) => ({
  projects: [],
  tasks: [],
  teamMembers: [],
  searchQuery: "",

  setSearchQuery: (query) => set({ searchQuery: query }),

  loadProjects: async () => {
    const response = await fetch("/api/projects", { method: "GET" })
    const projects = await parseJson<Project[]>(response)
    set({ projects: Array.isArray(projects) ? projects : [] })
  },

  loadTasks: async () => {
    const response = await fetch("/api/tasks", { method: "GET" })
    const tasks = await parseJson<Task[]>(response)
    set({ tasks: Array.isArray(tasks) ? tasks : [] })
  },

  loadTeamMembers: async () => {
    const response = await fetch("/api/team-members", { method: "GET" })
    const teamMembers = await parseJson<TeamMember[]>(response)
    set({ teamMembers: Array.isArray(teamMembers) ? teamMembers : [] })
  },

  addProject: async (project) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    })

    const created = await parseJson<Project>(response)
    set((state) => ({ projects: [...state.projects, created] }))
  },

  updateProject: async (id, updates) => {
    const response = await fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    })

    const updated = await parseJson<Project>(response)
    set((state) => ({
      projects: state.projects.map((project) => (project.id === id ? updated : project)),
    }))
  },

  deleteProject: async (id) => {
    await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })

    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
      tasks: state.tasks.filter((task) => task.projectId !== id),
    }))
  },

  getProjectBySlug: (slug) => get().projects.find((project) => project.slug === slug),

  addTask: async (task) => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    })

    const created = await parseJson<Task>(response)
    set((state) => ({ tasks: [...state.tasks, created] }))
  },

  updateTask: async (id, updates) => {
    const response = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    })

    const updated = await parseJson<Task>(response)
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? updated : task)),
    }))
  },

  deleteTask: async (id) => {
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })

    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }))
  },

  addTeamMember: async (member) => {
    const response = await fetch("/api/team-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    })

    const created = await parseJson<TeamMember>(response)
    set((state) => ({ teamMembers: [...state.teamMembers, created] }))
  },

  updateTeamMember: async (id, updates) => {
    const response = await fetch("/api/team-members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    })

    const updated = await parseJson<TeamMember>(response)
    set((state) => ({
      teamMembers: state.teamMembers.map((member) => (member.id === id ? updated : member)),
    }))
  },

  deleteTeamMember: async (id) => {
    const existing = get().teamMembers.find((member) => member.id === id) ?? null

    const response = await fetch("/api/team-members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })

    const result = await parseJson<{ deletedMember: TeamMember | null; affectedTasks: Task[] }>(response)

    set((state) => ({
      teamMembers: state.teamMembers.filter((member) => member.id !== id),
      tasks:
        result.affectedTasks.length > 0
          ? state.tasks.map((task) => {
              const affected = result.affectedTasks.find((affectedTask) => affectedTask.id === task.id)
              return affected ?? task
            })
          : state.tasks,
    }))

    return {
      deletedMember: result.deletedMember ?? existing,
      affectedTasks: result.affectedTasks,
    }
  },

  getTasksByAssignee: (memberName) =>
    get().tasks.filter((task) => task.assignees.includes(memberName)),
}))

if (typeof window !== "undefined") {
  void Promise.all([
    useStore.getState().loadProjects(),
    useStore.getState().loadTasks(),
    useStore.getState().loadTeamMembers(),
  ]).catch((error) => {
    console.error("Failed to load store data:", error)
  })
}
