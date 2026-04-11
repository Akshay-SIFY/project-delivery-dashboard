"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export function ProjectTasksChart() {
  const { projects, tasks } = useStore()
  const [viewMode, setViewMode] = useState<"overall" | "project">("overall")
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || "")

  // Calculate overall data
  const overallStatusCounts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }
  const overallTotal = Object.values(overallStatusCounts).reduce((a, b) => a + b, 0)

  const overallData = [
    {
      name: "To Do",
      value: overallStatusCounts.todo,
      percentage: overallTotal > 0 ? ((overallStatusCounts.todo / overallTotal) * 100).toFixed(1) : 0,
    },
    {
      name: "In Progress",
      value: overallStatusCounts["in-progress"],
      percentage: overallTotal > 0 ? ((overallStatusCounts["in-progress"] / overallTotal) * 100).toFixed(1) : 0,
    },
    {
      name: "Completed",
      value: overallStatusCounts.completed,
      percentage: overallTotal > 0 ? ((overallStatusCounts.completed / overallTotal) * 100).toFixed(1) : 0,
    },
  ].filter((item) => item.value > 0)

  // Calculate project-wise data
  const projectData = projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id)
    const projectTotal = projectTasks.length
    return {
      name: project.name,
      todo: projectTasks.filter((t) => t.status === "todo").length,
      "in-progress": projectTasks.filter((t) => t.status === "in-progress").length,
      completed: projectTasks.filter((t) => t.status === "completed").length,
      total: projectTotal,
    }
  })

  // Calculate selected project data
  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const selectedProjectTasks = selectedProject
    ? tasks.filter((t) => t.projectId === selectedProject.id)
    : []
  const selectedProjectTotal = selectedProjectTasks.length
  const selectedProjectStatusCounts = {
    todo: selectedProjectTasks.filter((t) => t.status === "todo").length,
    "in-progress": selectedProjectTasks.filter((t) => t.status === "in-progress").length,
    completed: selectedProjectTasks.filter((t) => t.status === "completed").length,
  }

  const selectedProjectData = [
    {
      name: "To Do",
      value: selectedProjectStatusCounts.todo,
      percentage: selectedProjectTotal > 0 ? ((selectedProjectStatusCounts.todo / selectedProjectTotal) * 100).toFixed(1) : 0,
    },
    {
      name: "In Progress",
      value: selectedProjectStatusCounts["in-progress"],
      percentage: selectedProjectTotal > 0 ? ((selectedProjectStatusCounts["in-progress"] / selectedProjectTotal) * 100).toFixed(1) : 0,
    },
    {
      name: "Completed",
      value: selectedProjectStatusCounts.completed,
      percentage: selectedProjectTotal > 0 ? ((selectedProjectStatusCounts.completed / selectedProjectTotal) * 100).toFixed(1) : 0,
    },
  ].filter((item) => item.value > 0)

  const displayData = viewMode === "overall" ? overallData : selectedProjectData
  const hasData = displayData.length > 0

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Task Distribution</CardTitle>
          <div className="flex gap-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as "overall" | "project")}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
            >
              <option value="overall">Overall</option>
              <option value="project">By Project</option>
            </select>
            {viewMode === "project" && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          {hasData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={displayData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: `1px solid hsl(var(--border))`,
                    borderRadius: "8px",
                  }}
                  formatter={(value, name, props) => [
                    `${value} tasks (${props.payload.percentage}%)`,
                    "",
                  ]}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {viewMode === "overall" ? "No tasks created yet" : "No tasks in this project"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
