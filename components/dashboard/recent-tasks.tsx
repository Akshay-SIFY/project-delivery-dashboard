"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export function RecentTasks() {
  const { tasks, subtasks, projects } = useStore()

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || "Unknown Project"
  }

  const getTaskSubtaskCount = (taskId: string) => {
    return subtasks.filter((s) => s.taskId === taskId).length
  }

  const priorityColors = {
    high: "bg-chart-4/10 text-chart-4",
    medium: "bg-chart-3/10 text-chart-3",
    low: "bg-chart-2/10 text-chart-2",
  }

  const statusColors = {
    todo: "border-muted-foreground/30",
    "in-progress": "border-primary bg-primary/10",
    completed: "border-chart-2 bg-chart-2",
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentTasks.map((task) => {
          const subtaskCount = getTaskSubtaskCount(task.id)
          return (
            <div key={task.id} className="rounded-lg p-3 transition-colors hover:bg-muted/50">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${statusColors[task.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {task.title}
                    </p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{getProjectName(task.projectId)}</span>
                    <span>•</span>
                    <span>{task.assignees.join(", ")}</span>
                    {subtaskCount > 0 && (
                      <>
                        <span>•</span>
                        <span>{subtaskCount} subtask{subtaskCount !== 1 ? "s" : ""}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
