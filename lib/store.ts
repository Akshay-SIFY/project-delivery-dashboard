"use client"

import { create } from "zustand"
import type { Project, Task, TeamMember } from "./types"

interface Store {
  projects: Project[]
  projectsLoaded: boolean
  tasks: Task[]
  tasksLoaded: boolean
  teamMembers: TeamMember[]
  teamLoaded: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  loadProjects: () => Promise<void>
  loadTasks: () => Promise<void>
  loadTeamMembers: () => Promise<void>
  addProject: (
    project: Omit<
      Project,
      "id" | "slug" | "createdAt" | "tasksCount" | "completedTasks" | "progress"
    >
  ) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  getProjectBySlug: (slug: string) => Project | undefined
  addTask: (task: Omit<Task, "id" | "createdAt">) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  addTeamMember: (member: Omit<TeamMember, "id">) => Promise<void>
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>
  deleteTeamMember: (id: string) => Promise<{ deletedMember: TeamMember; affectedTasks: Task[] }>
  getTasksByAssignee: (memberName: string) => Task[]
}

function recalculateProjectStats(projects: Project[], tasks: Task[]): Project[] {
  return projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id)
    const completedTasks = projectTasks.filter((task) => task.status === "completed").length
    const tasksCount = projectTasks.length
    const progress = tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0

    return { ...project, tasksCount, completedTasks, progress }
  })
}

export const useStore = create<Store>((set, get) => ({
  projects: [],
  projectsLoaded: false,
  tasks: [],
  tasksLoaded: false,
  teamMembers: [],
  teamLoaded: false,
  searchQuery: "",

  setSearchQuery: (query) => set({ searchQuery: query }),

  loadProjects: async () => {
    try {
      const res = await fetch("/api/projects")
      const data = await res.json()
      if (Array.isArray(data)) {
        set((state) => ({
          projects: recalculateProjectStats(data, state.tasks),
          projectsLoaded: true,
        }))
        return
      }
    } catch (err) {
      console.error("Failed to load projects:", err)
    }

    set({ projectsLoaded: true })
  },

  loadTasks: async () => {
    try {
      const res = await fetch("/api/tasks")
      const data = await res.json()
      if (Array.isArray(data)) {
        set((state) => {
          const projects = recalculateProjectStats(state.projects, data)
          return { tasks: data, tasksLoaded: true, projects }
        })
        return
      }
    } catch (err) {
      console.error("Failed to load tasks:", err)
    }

    set({ tasksLoaded: true })
  },

  loadTeamMembers: async () => {
    try {
      const res = await fetch("/api/team")
      const data = await res.json()
      if (Array.isArray(data)) {
        set({ teamMembers: data, teamLoaded: true })
        return
      }
    } catch (err) {
      console.error("Failed to load team members:", err)
    }

    set({ teamLoaded: true })
  },

  addProject: async (project) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    })

    const newProject = await res.json()

    set((state) => ({
      projects: [...state.projects, newProject],
    }))
  },

  updateProject: async (id, updates) => {
    const currentProject = get().projects.find((p) => p.id === id)
    if (!currentProject) return

    const payload = { ...currentProject, ...updates, id }

    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const updatedProject = await res.json()

    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
    }))
  },

  deleteProject: async (id) => {
    await fetch(`/api/projects/${id}`, {
      method: "DELETE",
    })

    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      tasks: state.tasks.filter((t) => t.projectId !== id),
    }))
  },

  getProjectBySlug: (slug) => {
    return get().projects.find((p) => p.slug === slug)
  },

  addTask: async (task) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    })

    const newTask = await res.json()

    set((state) => {
      const tasks = [...state.tasks, newTask]
      return {
        tasks,
        projects: recalculateProjectStats(state.projects, tasks),
      }
    })
  },

  updateTask: async (id, updates) => {
    const currentTask = get().tasks.find((task) => task.id === id)
    if (!currentTask) return

    const payload = { ...currentTask, ...updates, id }

    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const updatedTask = await res.json()

    set((state) => {
      const tasks = state.tasks.map((task) => (task.id === id ? updatedTask : task))
      return {
        tasks,
        projects: recalculateProjectStats(state.projects, tasks),
      }
    })
  },

  deleteTask: async (id) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      return
    }

    set((state) => {
      const tasks = state.tasks.filter((task) => task.id !== id)
      return {
        tasks,
        projects: recalculateProjectStats(state.projects, tasks),
      }
    })
  },

  addTeamMember: async (member) => {
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    })

    const newMember = await res.json()

    set((state) => ({
      teamMembers: [...state.teamMembers, newMember],
    }))
  },

  updateTeamMember: async (id, updates) => {
    const currentMember = get().teamMembers.find((member) => member.id === id)
    if (!currentMember) return

    const payload = { ...currentMember, ...updates, id }

    const res = await fetch(`/api/team/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const updatedMember = await res.json()

    set((state) => ({
      teamMembers: state.teamMembers.map((member) => (member.id === id ? updatedMember : member)),
      tasks: state.tasks.map((task) => {
        if (!updates.name || !currentMember?.name) return task

        const assignees = task.assignees.map((assignee) =>
          assignee === currentMember.name ? updates.name! : assignee
        )

        return { ...task, assignees }
      }),
    }))
  },

  deleteTeamMember: async (id) => {
    const state = get()
    const memberToDelete = state.teamMembers.find((member) => member.id === id)
    if (!memberToDelete) {
      return { deletedMember: null as any, affectedTasks: [] }
    }

    const affectedTasks = state.tasks.filter((task) => task.assignees.includes(memberToDelete.name))

    const res = await fetch(`/api/team/${id}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      return { deletedMember: memberToDelete, affectedTasks }
    }

    set((prev) => ({
      teamMembers: prev.teamMembers.filter((member) => member.id !== id),
      tasks: prev.tasks.map((task) => ({
        ...task,
        assignees: task.assignees.filter((name) => name !== memberToDelete.name),
      })),
    }))

    return { deletedMember: memberToDelete, affectedTasks }
  },

  getTasksByAssignee: (memberName) => {
    return get().tasks.filter((task) => task.assignees.includes(memberName))
  },
}))

if (typeof window !== "undefined") {
  const { loadProjects, loadTasks, loadTeamMembers } = useStore.getState()
  void loadProjects()
  void loadTasks()
  void loadTeamMembers()
}
