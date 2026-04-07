"use client"

import { FolderKanban, CheckSquare, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export function StatsCards() {
  const { projects, tasks } = useStore()

  const activeProjects = projects.filter((p) => p.status === "active").length
  const completedTasks = tasks.filter((t) => t.status === "completed").length
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length
  const overallProgress = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)
    : 0

  const stats = [
    {
      title: "Active Projects",
      value: activeProjects,
      change: "+2 this month",
      icon: FolderKanban,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Completed Tasks",
      value: completedTasks,
      change: `${tasks.length} total`,
      icon: CheckSquare,
      color: "bg-chart-2/10 text-chart-2",
    },
    {
      title: "In Progress",
      value: inProgressTasks,
      change: "Tasks being worked on",
      icon: Clock,
      color: "bg-chart-3/10 text-chart-3",
    },
    {
      title: "Overall Progress",
      value: `${overallProgress}%`,
      change: "Across all projects",
      icon: TrendingUp,
      color: "bg-chart-5/10 text-chart-5",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
