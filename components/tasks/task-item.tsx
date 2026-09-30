"use client"

import { useState } from "react"
import { Calendar, MoreHorizontal, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Task, TaskPriority, TaskStatus } from "@/lib/types"
import { useStore } from "@/lib/store"

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const { updateTask, deleteTask, teamMembers, tasks } = useStore()
  const [editOpen, setEditOpen] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(task.assignees)
  const [dependencies, setDependencies] = useState<string[]>(task.dependencies)
  const [startDate, setStartDate] = useState(task.startDate)
  const [dueDate, setDueDate] = useState(task.dueDate)

  const priorityColors = {
    high: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    medium: "bg-chart-3/10 text-chart-3 border-chart-3/30",
    low: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  }

  const statusColors = {
    todo: "border-muted-foreground/40 bg-background",
    "in-progress": "border-primary bg-primary/20",
    completed: "border-chart-2 bg-chart-2",
  }

  // Check if task is overdue
  const isOverdue =
    task.status !== "completed" &&
    new Date(task.dueDate) < new Date() &&
    new Date(task.dueDate).toDateString() !== new Date().toDateString()

  const handleStatusChange = (newStatus: TaskStatus) => {
    void updateTask(task.id, { status: newStatus })
  }

  const projectTasks = tasks.filter((t) => t.projectId === task.projectId && t.id !== task.id)

  const handleAssigneeToggle = (memberName: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(memberName)
        ? prev.filter((name) => name !== memberName)
        : [...prev, memberName]
    )
  }

  const handleDependencyToggle = (taskId: string) => {
    setDependencies((prev) =>
      prev.includes(taskId)
        ? prev.filter((dependencyId) => dependencyId !== taskId)
        : [...prev, taskId]
    )
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateTask(task.id, {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      assignees: selectedAssignees,
      dependencies,
      startDate,
      dueDate,
    })
    setEditOpen(false)
  }

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg border p-4 transition-all hover:shadow-md ${
        isOverdue
          ? "border-destructive/50 bg-destructive/5"
          : "border-border/50 bg-card"
      }`}
    >
      <button
        onClick={() =>
          handleStatusChange(task.status === "completed" ? "todo" : "completed")
        }
        className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${statusColors[task.status]}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`font-medium ${
              task.status === "completed"
                ? "text-muted-foreground line-through"
                : "text-foreground"
            }`}
          >
            {task.title}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange("todo")}>
                Mark as To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("in-progress")}>
                Mark as In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => void deleteTask(task.id)}
              >
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {task.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${priorityColors[task.priority]}`}
          >
            {task.priority}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <div className="flex flex-wrap gap-1">
              {task.assignees.map((assignee, idx) => (
                <span key={idx} className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                  {assignee}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(task.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            →{" "}
            {new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
          {task.dependencies.length > 0 && (
            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
              {task.dependencies.length} dependency
            </span>
          )}
          {isOverdue && (
            <span className="ml-auto rounded-full border border-destructive bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              Overdue
            </span>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              required
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-input p-2">
              {teamMembers.map((member) => (
                <label key={member.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedAssignees.includes(member.name)}
                    onChange={() => handleAssigneeToggle(member.name)}
                  />
                  {member.name}
                </label>
              ))}
            </div>
            {projectTasks.length > 0 && (
              <div className="max-h-24 space-y-1 overflow-y-auto rounded-lg border border-input p-2">
                {projectTasks.map((projectTask) => (
                  <label key={projectTask.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={dependencies.includes(projectTask.id)}
                      onChange={() => handleDependencyToggle(projectTask.id)}
                    />
                    {projectTask.title}
                  </label>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
                required
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
