"use client"

import { create } from "zustand"
import type { Project, Task, TeamMember, Subtask } from "./types"

interface Store {
  projects: Project[]
  tasks: Task[]
  subtasks: Subtask[]
  teamMembers: TeamMember[]
  searchQuery: string
  projectsLoaded: boolean
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
  addTask: (task: Omit<Task, "id" | "createdAt" | "subtasks">) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  addSubtask: (subtask: Omit<Subtask, "id" | "createdAt">) => Promise<void>
  updateSubtask: (id: string, updates: Partial<Subtask>) => Promise<void>
  deleteSubtask: (id: string) => Promise<void>
  getSubtasksByTaskId: (taskId: string) => Subtask[]
  addTeamMember: (member: Omit<TeamMember, "id">) => Promise<void>
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>
  deleteTeamMember: (id: string) => Promise<{ deletedMember: TeamMember | null; affectedTasks: Task[] }>
  getTasksByAssignee: (memberName: string) => Task[]
  loadProjects: () => Promise<void>
  loadTasks: () => Promise<void>
  loadSubtasks: () => Promise<void>
  loadTeamMembers: () => Promise<void>
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed: ${response.status} ${response.statusText}`
    throw new Error(message)
  }

  return payload as T
}

function recalculateProjectStats(projects: Project[], tasks: Task[]): Project[] {
  return projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id)
    const completedTasks = projectTasks.filter((task) => task.status === "completed").length
    const tasksCount = projectTasks.length
    const progress = tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0

    return {
      ...project,
      tasksCount,
      completedTasks,
      progress,
    }
  })
}

export const useStore = create<Store>((set, get) => ({
  projects: [],
  tasks: [],
  subtasks: [],
  teamMembers: [],
  searchQuery: "",
  projectsLoaded: false,

  setSearchQuery: (query) => set({ searchQuery: query }),

  loadProjects: async () => {
    const response = await fetch("/api/projects", { method: "GET" })
    const projects = await parseJson<Project[]>(response)

    set((state) => ({
      projects: recalculateProjectStats(Array.isArray(projects) ? projects : [], state.tasks),
      projectsLoaded: true,
    }))
  },

  loadTasks: async () => {
    const response = await fetch("/api/tasks", { method: "GET" })
    const tasks = await parseJson<Task[]>(response)

    set((state) => {
      const safeTasks = Array.isArray(tasks) ? tasks : []
      return {
        tasks: safeTasks,
        projects: recalculateProjectStats(state.projects, safeTasks),
      }
    })
  },

  loadSubtasks: async () => {
    const response = await fetch("/api/subtasks", { method: "GET" })
    const subtasks = await parseJson<Subtask[]>(response)
    set({ subtasks: Array.isArray(subtasks) ? subtasks : [] })
  },

  loadTeamMembers: async () => {
    const response = await fetch("/api/team", { method: "GET" })
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

    set((state) => ({
      projects: recalculateProjectStats([...state.projects, created], state.tasks),
    }))
  },

  updateProject: async (id, updates) => {
    const currentProject = get().projects.find((project) => project.id === id)
    if (!currentProject) return

    const response = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...currentProject, ...updates, id }),
    })

    const updated = await parseJson<Project>(response)

    set((state) => ({
      projects: recalculateProjectStats(
        state.projects.map((project) => (project.id === id ? updated : project)),
        state.tasks,
      ),
    }))
  },

  deleteProject: async (id) => {
    const response = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      await parseJson(response)
    }

    set((state) => {
      const tasks = state.tasks.filter((task) => task.projectId !== id)
      const projects = state.projects.filter((project) => project.id !== id)

      return {
        tasks,
        projects: recalculateProjectStats(projects, tasks),
      }
    })
  },

  getProjectBySlug: (slug) => get().projects.find((project) => project.slug === slug),

  addTask: async (task) => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    })

    const created = await parseJson<Task>(response)

    set((state) => {
      const tasks = [...state.tasks, created]
      return {
        tasks,
        projects: recalculateProjectStats(state.projects, tasks),
      }
    })
  },

  updateTask: async (id, updates) => {
    const currentTask = get().tasks.find((task) => task.id === id)
    if (!currentTask) return

    const response = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...currentTask, ...updates, id }),
    })

    const updated = await parseJson<Task>(response)

    set((state) => {
      const tasks = state.tasks.map((task) => (task.id === id ? updated : task))
      return {
        tasks,
        projects: recalculateProjectStats(state.projects, tasks),
      }
    })
  },

  deleteTask: async (id) => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      await parseJson(response)
    }

    set((state) => {
      const tasks = state.tasks.filter((task) => task.id !== id)
      const subtasks = state.subtasks.filter((subtask) => subtask.taskId !== id)
      return {
        tasks,
        subtasks,
        projects: recalculateProjectStats(state.projects, tasks),
      }
    })
  },

  addSubtask: async (subtask) => {
    const response = await fetch("/api/subtasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subtask),
    })

    const created = await parseJson<Subtask>(response)

    set((state) => ({
      subtasks: [...state.subtasks, created],
    }))
  },

  updateSubtask: async (id, updates) => {
    const currentSubtask = get().subtasks.find((subtask) => subtask.id === id)
    if (!currentSubtask) return

    const response = await fetch(`/api/subtasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...currentSubtask, ...updates, id }),
    })

    const updated = await parseJson<Subtask>(response)

    set((state) => ({
      subtasks: state.subtasks.map((subtask) => (subtask.id === id ? updated : subtask)),
    }))
  },

  deleteSubtask: async (id) => {
    const response = await fetch(`/api/subtasks/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      await parseJson(response)
    }

    set((state) => ({
      subtasks: state.subtasks.filter((subtask) => subtask.id !== id),
    }))
  },

  getSubtasksByTaskId: (taskId) =>
    get().subtasks.filter((subtask) => subtask.taskId === taskId),

  addTeamMember: async (member) => {
    const response = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    })

    const created = await parseJson<TeamMember>(response)

    set((state) => ({
      teamMembers: [...state.teamMembers, created],
    }))
  },

  updateTeamMember: async (id, updates) => {
    const existing = get().teamMembers.find((member) => member.id === id)
    if (!existing) return

    const response = await fetch(`/api/team/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...existing, ...updates, id }),
    })

    const updated = await parseJson<TeamMember>(response)

    set((state) => ({
      teamMembers: state.teamMembers.map((member) => (member.id === id ? updated : member)),
      tasks:
        updates.name && existing.name !== updates.name
          ? state.tasks.map((task) => ({
              ...task,
              assignees: task.assignees.map((assignee) =>
                assignee === existing.name ? updates.name! : assignee,
              ),
            }))
          : state.tasks,
      subtasks:
        updates.name && existing.name !== updates.name
          ? state.subtasks.map((subtask) => ({
              ...subtask,
              assignees: subtask.assignees.map((assignee) =>
                assignee === existing.name ? updates.name! : assignee,
              ),
            }))
          : state.subtasks,
    }))
  },

  deleteTeamMember: async (id) => {
    const existing = get().teamMembers.find((member) => member.id === id) ?? null

    const response = await fetch(`/api/team/${id}`, {
      method: "DELETE",
    })

    const result = await parseJson<{ deletedMember?: TeamMember | null; affectedTasks?: Task[] }>(response)
    const affectedTasks = Array.isArray(result.affectedTasks) ? result.affectedTasks : []

    set((state) => ({
      teamMembers: state.teamMembers.filter((member) => member.id !== id),
      tasks:
        affectedTasks.length > 0
          ? state.tasks.map((task) => {
              const affected = affectedTasks.find((affectedTask) => affectedTask.id === task.id)
              return affected ?? task
            })
          : existing
            ? state.tasks.map((task) => ({
                ...task,
                assignees: task.assignees.filter((assignee) => assignee !== existing.name),
              }))
            : state.tasks,
      subtasks: existing
        ? state.subtasks.map((subtask) => ({
            ...subtask,
            assignees: subtask.assignees.filter((assignee) => assignee !== existing.name),
          }))
        : state.subtasks,
    }))

    return {
      deletedMember: result.deletedMember ?? existing,
      affectedTasks,
    }
  },

  getTasksByAssignee: (memberName) =>
    get().tasks.filter((task) => task.assignees.includes(memberName)),
}))

if (typeof window !== "undefined") {
  void Promise.all([
    useStore.getState().loadProjects(),
    useStore.getState().loadTasks(),
    useStore.getState().loadSubtasks(),
    useStore.getState().loadTeamMembers(),
  ]).catch((error) => {
    console.error("Failed to load store data:", error)
  })
}
