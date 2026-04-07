export type TaskPriority = "low" | "medium" | "high"
export type TaskStatus = "todo" | "in-progress" | "completed"
export type ProjectStatus = "active" | "completed" | "on-hold"

export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  assignee: string
  dueDate: string
  projectId: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  progress: number
  tasksCount: number
  completedTasks: number
  dueDate: string
  createdAt: string
  color: string
}

export interface TeamMember {
  id: string
  name: string
  avatar: string
  role: string
}
