"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ProjectCard } from "@/components/dashboard/project-card"
import { RecentTasks } from "@/components/dashboard/recent-tasks"
import { TaskStatusChart } from "@/components/dashboard/task-status-chart"
import { ProjectTasksChart } from "@/components/dashboard/project-tasks-chart"
import { useStore } from "@/lib/store"

export default function DashboardPage() {
  const { projects, searchQuery } = useStore()

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeProjects = filteredProjects.filter((p) => p.status === "active")

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64">
        <AppHeader
          title="My Project Dashboard"
          description="Overview of your projects and tasks"
        />
        <div className="space-y-8 p-6">
          <StatsCards />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Active Projects
                </h2>
                <a
                  href="/projects"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all
                </a>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {activeProjects.slice(0, 4).map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                {activeProjects.length === 0 && (
                  <p className="col-span-2 text-center text-sm text-muted-foreground py-8">
                    No active projects found
                  </p>
                )}
              </div>
            </div>
            <RecentTasks />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TaskStatusChart />
            <ProjectTasksChart />
          </div>
        </div>
      </main>
    </div>
  )
}
