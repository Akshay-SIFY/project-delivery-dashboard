"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import type { Project, ProjectStatus } from "@/lib/types"

interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
}

const projectColors = [
  "oklch(0.55 0.15 195)",
  "oklch(0.65 0.15 145)",
  "oklch(0.6 0.18 45)",
  "oklch(0.55 0.2 25)",
  "oklch(0.5 0.15 280)",
]

export function EditProjectDialog({ open, onOpenChange, project }: EditProjectDialogProps) {
  const { updateProject } = useStore()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("active")
  const [dueDate, setDueDate] = useState("")
  const [color, setColor] = useState(projectColors[0])

  useEffect(() => {
    if (!project || !open) return

    setName(project.name)
    setDescription(project.description)
    setStatus(project.status)
    setDueDate(project.dueDate || "")
    setColor(project.color || projectColors[0])
  }, [project, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !name.trim() || !dueDate) return

    await updateProject(project.id, {
      name: name.trim(),
      description: description.trim(),
      status,
      dueDate,
      color,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              >
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Color</label>
            <div className="flex items-center gap-2">
              {projectColors.map((projectColor) => (
                <button
                  key={projectColor}
                  type="button"
                  onClick={() => setColor(projectColor)}
                  className={`h-8 w-8 rounded-full transition-all ${
                    color === projectColor ? "ring-2 ring-ring ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: projectColor }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
