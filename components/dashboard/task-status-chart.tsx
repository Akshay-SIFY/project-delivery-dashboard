"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export function TaskStatusChart() {
  const { tasks } = useStore()

  const statusCounts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }

  const data = [
    { name: "To Do", value: statusCounts.todo, color: "#94a3b8" },
    { name: "In Progress", value: statusCounts["in-progress"], color: "#3b82f6" },
    { name: "Completed", value: statusCounts.completed, color: "#10b981" },
  ].filter((item) => item.value > 0)

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0)

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Task Status Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: `1px solid hsl(var(--border))`,
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value} tasks`, ""]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No tasks created yet</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
