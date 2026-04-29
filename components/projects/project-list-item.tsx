"use client"

import Link from "next/link"
import { Calendar, MoreHorizontal, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Project } from "@/lib/types"
import { useStore } from "@/lib/store"

interface ProjectListItemProps {
  project: Project
}

export function ProjectListItem({ project }: ProjectListItemProps) {
  const { deleteProject, updateProject } = useStore()

  const statusColors = {
    active: "bg-chart-2/10 text-chart-2",
    completed: "bg-primary/10 text-primary",
    "on-hold": "bg-chart-3/10 text-chart-3",
  }

  return (
    <div className="group flex items-center gap-4 rounded-lg border border-border/50 bg-card p-4 transition-shadow hover:shadow-md">
      <div
        className="h-10 w-10 shrink-0 rounded-lg"
        style={{ backgroundColor: project.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${project.slug}`}
            className="font-semibold text-foreground hover:text-primary transition-colors truncate"
          >
            {project.name}
          </Link>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[project.status]}`}
          >
            {project.status.replace("-", " ")}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground truncate">
          {project.description}
        </p>
      </div>
      <div className="hidden md:flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{project.progress}%</p>
          <p className="text-xs text-muted-foreground">Progress</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{project.completedTasks}/{project.tasksCount}</p>
          <p className="text-xs text-muted-foreground">Tasks</p>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {new Date(project.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.slug}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                const name = window.prompt("Project name", project.name)
                if (name === null || !name.trim()) return

                const description = window.prompt("Project description", project.description)
                if (description === null) return

                await updateProject(project.id, {
                  name: name.trim(),
                  description: description.trim(),
                })
              }}
            >
              Edit Project
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={async () => {
                await deleteProject(project.id)
              }}
            >
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link
          href={`/projects/${project.slug}`}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
