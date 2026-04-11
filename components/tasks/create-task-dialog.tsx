"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import type { TaskPriority, TaskStatus } from "@/lib/types"

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function CreateTaskDialog({ open, onOpenChange, projectId }: CreateTaskDialogProps) {
  const { addTask, teamMembers, tasks } = useStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [status, setStatus] = useState<TaskStatus>("todo")
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [dependencies, setDependencies] = useState<string[]>([])
  const [startDate, setStartDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [dateError, setDateError] = useState("")

  const projectTasks = tasks.filter((t) => t.projectId === projectId)

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
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    setDateError("")
    
    if (!title.trim() || !startDate || !dueDate) {
      setDateError("Both start and due dates are required")
      return
    }

    if (selectedAssignees.length === 0) {
      setDateError("Please select at least one assignee")
      return
    }

    if (new Date(dueDate) < new Date(startDate)) {
      setDateError("Due date cannot be before start date")
      return
    }

    addTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      assignees: selectedAssignees,
      dependencies,
      startDate,
      dueDate,
      projectId,
    })

    setTitle("")
    setDescription("")
    setPriority("medium")
    setStatus("todo")
    setSelectedAssignees([])
    setDependencies([])
    setStartDate("")
    setDueDate("")
    setDateError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Assign To (select one or more)
            </label>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-input bg-background p-2">
              {teamMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedAssignees.includes(member.name)}
                    onChange={() => handleAssigneeToggle(member.name)}
                    className="h-4 w-4 rounded border-input cursor-pointer"
                  />
                  <span className="text-sm">{member.name}</span>
                </label>
              ))}
            </div>
          </div>

          {projectTasks.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Dependencies (optional)
              </label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-input bg-background p-2">
                {projectTasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={dependencies.includes(task.id)}
                      onChange={() => handleDependencyToggle(task.id)}
                      className="h-4 w-4 rounded border-input cursor-pointer"
                    />
                    <span className="text-sm">{task.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setDateError("")
                }}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value)
                  setDateError("")
                }}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
                required
              />
            </div>
          </div>

          {dateError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {dateError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
