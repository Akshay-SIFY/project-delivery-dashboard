"use client"

import { useState } from "react"
import { Check, Plus, Trash2 } from "lucide-react"
import { useStore } from "@/lib/store"
import type { SubtaskStatus } from "@/lib/types"

export function SubtaskList({ taskId }: { taskId: string }) {
  const { subtasks, addSubtask, updateSubtask, deleteSubtask } = useStore()
  const items = subtasks.filter((item) => item.taskId === taskId)
  const [title, setTitle] = useState("")
  const [adding, setAdding] = useState(false)

  const create = async () => {
    if (!title.trim()) return
    await addSubtask({ title: title.trim(), description: "", status: "todo", taskId, assignees: [], startDate: "", dueDate: "" })
    setTitle("")
    setAdding(false)
  }

  return (
    <div className="mt-3 rounded-md border border-border/50 bg-muted/20 p-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Subtasks ({items.length})</span>
        <button type="button" onClick={() => setAdding((value) => !value)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3" /> Add</button>
      </div>
      {adding && <div className="mb-2 flex gap-2"><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void create() }} placeholder="Subtask title" className="h-8 min-w-0 flex-1 rounded border border-input bg-background px-2 text-xs" /><button type="button" onClick={() => void create()} className="rounded bg-primary px-2 text-xs text-primary-foreground">Save</button></div>}
      {items.map((item) => <div key={item.id} className="flex items-center gap-2 py-1 text-xs"><button type="button" aria-label="Toggle subtask" onClick={() => void updateSubtask(item.id, { status: item.status === "completed" ? "todo" : "completed" as SubtaskStatus })} className={`flex h-4 w-4 items-center justify-center rounded border ${item.status === "completed" ? "border-chart-2 bg-chart-2 text-white" : "border-muted-foreground/50"}`}>{item.status === "completed" && <Check className="h-3 w-3" />}</button><span className={`flex-1 ${item.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.title}</span><button type="button" aria-label="Delete subtask" onClick={() => void deleteSubtask(item.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button></div>)}
    </div>
  )
}
