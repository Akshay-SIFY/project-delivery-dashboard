export type TaskPriority = "low" | "medium" | "high"
export type TaskStatus = "todo" | "in-progress" | "completed"
export type ProjectStatus = "active" | "completed" | "on-hold"
export type SubtaskStatus = "todo" | "in-progress" | "completed"

export interface Subtask {
  id: string
  title: string
  description: string
  status: SubtaskStatus
  taskId: string
  assignees: string[]
  startDate: string
  dueDate: string
  remarks?: string
  notes?: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  assignees: string[]
  dependencies: string[]
  startDate: string
  dueDate: string
  projectId: string
  createdAt: string
  subtasks?: Subtask[]
}

export interface Project {
  id: string
  name: string
  description: string
  slug: string
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
