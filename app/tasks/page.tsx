"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { TaskItem } from "@/components/tasks/task-item"
import { ExcelImportDialog } from "@/components/tasks/excel-import-dialog"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { useStore } from "@/lib/store"

const dateValue = (d?: string | null) => {
  const t = d ? new Date(d).getTime() : NaN
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t
}

export default function TasksPage() {
  const { tasks, projects, teamMembers, searchQuery } = useStore()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || t.status === statusFilter
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter
    const matchesProject = projectFilter === "all" || t.projectId === projectFilter
    const matchesAssignee = assigneeFilter === "all" || t.assignees.includes(assigneeFilter)
    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesAssignee
    }).sort(
    (a, b) =>
      dateValue(a.startDate) - dateValue(b.startDate) ||
      dateValue(a.dueDate) - dateValue(b.dueDate) ||
      Number(a.id) - Number(b.id)
  )

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || "Unknown Project"
  }

  const groupedTasks = {
    todo: filteredTasks.filter((t) => t.status === "todo"),
    "in-progress": filteredTasks.filter((t) => t.status === "in-progress"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64">
        <AppHeader
          title="All Tasks"
          description="View and manage all tasks across projects"
        />
        <div className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              >
                <option value="all">All Projects</option>
                                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              >
                <option value="all">All Members</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
              <Button onClick={() => setImportDialogOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Import from Excel
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {(["todo", "in-progress", "completed"] as const).map((status) => (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground capitalize">
                    {status === "in-progress" ? "In Progress" : status === "todo" ? "To Do" : "Completed"}
                  </h2>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {groupedTasks[status].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {groupedTasks[status].map((task) => (
                    <div key={task.id} className="space-y-1">
                      <TaskItem task={task} />
                      <Link
                        href={`/projects/${projects.find((p) => p.id === task.projectId)?.slug}`}
                        className="ml-8 text-xs text-primary hover:underline"
                      >
                        {getProjectName(task.projectId)}
                      </Link>
                    </div>
                  ))}
                  {groupedTasks[status].length === 0 && (
                    <div className="rounded-lg border border-dashed border-border py-8 text-center">
                      <p className="text-sm text-muted-foreground">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <ExcelImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
        <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </main>
    </div>
  )
}
