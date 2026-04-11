"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AddTeamMemberDialog,
  EditTeamMemberDialog,
  DeleteTeamMemberDialog,
} from "@/components/team/team-member-dialogs"
import { useStore } from "@/lib/store"
import type { TeamMember } from "@/lib/types"

export default function TeamPage() {
  const { teamMembers, tasks, addTeamMember, updateTeamMember, deleteTeamMember, getTasksByAssignee } = useStore()
  
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [affectedTasks, setAffectedTasks] = useState<any[]>([])

  const getMemberTaskCount = (memberName: string) => {
    return tasks.filter((t) => t.assignees.includes(memberName)).length
  }

  const getMemberCompletedTasks = (memberName: string) => {
    return tasks.filter((t) => t.assignees.includes(memberName) && t.status === "completed").length
  }

  const handleAddMember = (member: Omit<TeamMember, "id">) => {
    addTeamMember(member)
    setAddDialogOpen(false)
  }

  const handleEditClick = (member: TeamMember) => {
    setSelectedMember(member)
    setEditDialogOpen(true)
  }

  const handleUpdateMember = (id: string, updates: Partial<TeamMember>) => {
    updateTeamMember(id, updates)
    setEditDialogOpen(false)
    setSelectedMember(null)
  }

  const handleDeleteClick = (member: TeamMember) => {
    const affected = getTasksByAssignee(member.name)
    setAffectedTasks(affected)
    setSelectedMember(member)
    setDeleteDialogOpen(true)
  }

  const handleDeleteMember = () => {
    if (!selectedMember) return
    deleteTeamMember(selectedMember.id)
    setDeleteDialogOpen(false)
    setSelectedMember(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64">
        <AppHeader
          title="Team"
          description="Manage team members and view their assignments"
        />
        <div className="p-6">
          <div className="mb-6 flex justify-end">
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Team Member
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => {
              const totalTasks = getMemberTaskCount(member.name)
              const completedTasks = getMemberCompletedTasks(member.name)
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

              return (
                <Card key={member.id} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground flex-shrink-0">
                          {member.avatar}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{member.name}</h3>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditClick(member)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(member)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Assigned Tasks</span>
                        <span className="font-medium text-foreground">{totalTasks}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-medium text-foreground">{completedTasks}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">{progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <AddTeamMemberDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onAdd={handleAddMember}
        />
        <EditTeamMemberDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          member={selectedMember}
          onUpdate={handleUpdateMember}
        />
        <DeleteTeamMemberDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          member={selectedMember}
          affectedTasks={affectedTasks}
          onDelete={handleDeleteMember}
        />
      </main>
    </div>
  )
}
