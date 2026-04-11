"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export function ProjectTasksChart() {
  const { projects, tasks } = useStore()

  const data = projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id)
    return {
      name: project.name,
      todo: projectTasks.filter((t) => t.status === "todo").length,
      "in-progress": projectTasks.filter((t) => t.status === "in-progress").length,
      completed: projectTasks.filter((t) => t.status === "completed").length,
    }
  })

  const hasData = data.some((d) => d.todo > 0 || d["in-progress"] > 0 || d.completed > 0)

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Project-wise Task Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          {hasData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: `1px solid hsl(var(--border))`,
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value} tasks`, ""]}
                />
                <Legend />
                <Bar dataKey="todo" stackId="a" fill="#94a3b8" name="To Do" />
                <Bar dataKey="in-progress" stackId="a" fill="#3b82f6" name="In Progress" />
                <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No projects with tasks yet</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
