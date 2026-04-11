"use client"

import { Calendar, MoreHorizontal, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Task, TaskStatus } from "@/lib/types"
import { useStore } from "@/lib/store"

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const { updateTask, deleteTask } = useStore()

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
    updateTask(task.id, { status: newStatus })
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => deleteTask(task.id)}
              >
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
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
    </div>
  )
}
