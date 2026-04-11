"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export function TaskStatusChart() {
  const { tasks } = useStore()

  const statusCounts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0)

  const data = [
    { 
      name: "To Do", 
      value: statusCounts.todo, 
      percentage: total > 0 ? ((statusCounts.todo / total) * 100).toFixed(1) : 0,
      color: "#94a3b8" 
    },
    { 
      name: "In Progress", 
      value: statusCounts["in-progress"],
      percentage: total > 0 ? ((statusCounts["in-progress"] / total) * 100).toFixed(1) : 0,
      color: "#3b82f6" 
    },
    { 
      name: "Completed", 
      value: statusCounts.completed,
      percentage: total > 0 ? ((statusCounts.completed / total) * 100).toFixed(1) : 0,
      color: "#10b981" 
    },
  ].filter((item) => item.value > 0)

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Task Status Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
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
                <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No tasks created yet</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
