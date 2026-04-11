"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import type { TeamMember, Task } from "@/lib/types"

interface AddTeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (member: Omit<TeamMember, "id">) => void
}

export function AddTeamMemberDialog({
  open,
  onOpenChange,
  onAdd,
}: AddTeamMemberDialogProps) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim() || !role.trim()) {
      setError("Both name and role are required")
      return
    }

    const avatar = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    onAdd({
      name: name.trim(),
      role: role.trim(),
      avatar,
    })

    setName("")
    setRole("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Create a new team member with a name and role
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Smith"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Developer"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditTeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: TeamMember | null
  onUpdate: (id: string, updates: Partial<TeamMember>) => void
}

export function EditTeamMemberDialog({
  open,
  onOpenChange,
  member,
  onUpdate,
}: EditTeamMemberDialogProps) {
  const [name, setName] = useState(member?.name || "")
  const [role, setRole] = useState(member?.role || "")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim() || !role.trim()) {
      setError("Both name and role are required")
      return
    }

    if (!member) return

    const avatar = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    onUpdate(member.id, {
      name: name.trim(),
      role: role.trim(),
      avatar,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update the team member&apos;s name and role
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-colors focus:border-ring focus:ring-1"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update Member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteTeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: TeamMember | null
  affectedTasks: Task[]
  onDelete: () => void
}

export function DeleteTeamMemberDialog({
  open,
  onOpenChange,
  member,
  affectedTasks,
  onDelete,
}: DeleteTeamMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Team Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {member?.name}?
          </DialogDescription>
        </DialogHeader>

        {affectedTasks.length > 0 && (
          <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  This member is assigned to {affectedTasks.length} task{affectedTasks.length !== 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                  Deleting this member will remove them from all assigned tasks
                </p>
                <ul className="mt-2 space-y-1">
                  {affectedTasks.slice(0, 3).map((task) => (
                    <li key={task.id} className="text-xs text-yellow-700 dark:text-yellow-300">
                      • {task.title}
                    </li>
                  ))}
                  {affectedTasks.length > 3 && (
                    <li className="text-xs text-yellow-700 dark:text-yellow-300">
                      • and {affectedTasks.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onDelete()
              onOpenChange(false)
            }}
          >
            Delete Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
