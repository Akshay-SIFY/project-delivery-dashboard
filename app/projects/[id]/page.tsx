"use client"

import { use, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Plus, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { TaskItem } from "@/components/tasks/task-item"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { projects, tasks, searchQuery } = useStore()
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const project = projects.find((p) => p.id === id)

  if (!project) {
    notFound()
  }

  const projectTasks = tasks.filter((t) => t.projectId === id)
  const filteredTasks = projectTasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const todoCount = projectTasks.filter((t) => t.status === "todo").length
  const inProgressCount = projectTasks.filter((t) => t.status === "in-progress").length
  const completedCount = projectTasks.filter((t) => t.status === "completed").length

  const statusColors = {
    active: "bg-chart-2/10 text-chart-2",
    completed: "bg-primary/10 text-primary",
    "on-hold": "bg-chart-3/10 text-chart-3",
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64">
        <AppHeader
          title={project.name}
          description={project.description}
        />
        <div className="p-6">
          <Link
            href="/projects"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-muted p-2.5">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold text-foreground">
                    {new Date(project.dueDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-chart-3/10 p-2.5">
                  <AlertCircle className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To Do</p>
                  <p className="font-semibold text-foreground">{todoCount} tasks</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="font-semibold text-foreground">{inProgressCount} tasks</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-chart-2/10 p-2.5">
                  <CheckCircle2 className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-semibold text-foreground">{completedCount} tasks</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Progress</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[project.status]}`}
              >
                {project.status.replace("-", " ")}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {project.completedTasks} of {project.tasksCount} tasks completed
                </span>
                <span className="font-medium text-foreground">{project.progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {filteredTasks.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
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
              <Button onClick={() => setIsCreateTaskOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
            {filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                <p className="text-lg font-medium text-foreground">No tasks found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {projectTasks.length === 0
                    ? "Get started by adding your first task"
                    : "Try adjusting your search or filters"}
                </p>
                {projectTasks.length === 0 && (
                  <Button
                    onClick={() => setIsCreateTaskOpen(true)}
                    className="mt-4 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        projectId={id}
      />
    </div>
  )
}
