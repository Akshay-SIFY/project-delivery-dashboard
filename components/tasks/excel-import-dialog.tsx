"use client"

import { useState } from "react"
import { Download, Upload, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { downloadSampleExcel, parseCSV } from "@/lib/excel-utils"
import type { TaskPriority, TaskStatus } from "@/lib/types"

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ImportPreview {
  projectName: string
  taskName: string
  description: string
  assignedTo: string
  dependencies: string
  startDate: string
  endDate: string
  status: string
  priority: string
  errors?: string[]
}

export function ExcelImportDialog({ open, onOpenChange }: ExcelImportDialogProps) {
  const { addTask, projects, teamMembers } = useStore()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)

  const validateImportData = (rows: any[]): { valid: ImportPreview[]; errors: string[] } => {
    const validRows: ImportPreview[] = []
    const errors: string[] = []

    rows.forEach((row, index) => {
      const rowErrors: string[] = []

      // Validate project name
      if (!row.projectName || !row.projectName.trim()) {
        rowErrors.push("Project name is required")
      } else {
        const project = projects.find((p) => p.name.toLowerCase() === row.projectName.toLowerCase())
        if (!project) {
          rowErrors.push(`Project "${row.projectName}" not found`)
        }
      }

      // Validate task name
      if (!row.taskName || !row.taskName.trim()) {
        rowErrors.push("Task name is required")
      }

      // Validate assignees
      if (!row.assignedTo || !row.assignedTo.trim()) {
        rowErrors.push("At least one assignee is required")
      } else {
        const assignees = row.assignedTo.split(",").map((a: string) => a.trim())
        const invalidAssignees = assignees.filter(
          (name: string) => !teamMembers.find((m) => m.name.toLowerCase() === name.toLowerCase())
        )
        if (invalidAssignees.length > 0) {
          rowErrors.push(`Invalid assignee(s): ${invalidAssignees.join(", ")}`)
        }
      }

      // Validate dates
      if (!row.startDate || !row.startDate.trim()) {
        rowErrors.push("Start date is required")
      }
      if (!row.endDate || !row.endDate.trim()) {
        rowErrors.push("End date is required")
      } else if (row.startDate && new Date(row.endDate) < new Date(row.startDate)) {
        rowErrors.push("End date cannot be before start date")
      }

      // Validate status
      const validStatuses: TaskStatus[] = ["todo", "in-progress", "completed"]
      if (!row.status || !validStatuses.includes(row.status.toLowerCase())) {
        rowErrors.push(`Status must be one of: ${validStatuses.join(", ")}`)
      }

      // Validate priority
      const validPriorities: TaskPriority[] = ["low", "medium", "high"]
      if (!row.priority || !validPriorities.includes(row.priority.toLowerCase())) {
        rowErrors.push(`Priority must be one of: ${validPriorities.join(", ")}`)
      }

      if (rowErrors.length === 0) {
        validRows.push({
          ...row,
          errors: undefined,
        })
      } else {
        errors.push(`Row ${index + 2}: ${rowErrors.join("; ")}`)
      }
    })

    return { valid: validRows, errors }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setImportErrors([])
    setPreview([])

    const text = await selectedFile.text()
    const rows = parseCSV(text)

    const { valid, errors } = validateImportData(rows)
    setPreview(valid)
    setImportErrors(errors)
  }

  const handleImport = async () => {
    if (preview.length === 0) {
      setImportErrors(["No valid rows to import"])
      return
    }

    setImporting(true)

    try {
      preview.forEach((row) => {
        const project = projects.find((p) => p.name.toLowerCase() === row.projectName.toLowerCase())
        if (!project) return

        const assignees = row.assignedTo
          .split(",")
          .map((a: string) => a.trim())
          .filter((a) => teamMembers.find((m) => m.name.toLowerCase() === a.toLowerCase()))
          .map((a) => a.charAt(0).toUpperCase() + a.slice(1))

        addTask({
          title: row.taskName,
          description: row.description || "",
          priority: row.priority.toLowerCase() as TaskPriority,
          status: row.status.toLowerCase() as TaskStatus,
          assignees,
          dependencies: [],
          startDate: row.startDate,
          dueDate: row.endDate,
          projectId: project.id,
        })
      })

      setFile(null)
      setPreview([])
      setImportErrors([])
      setImporting(false)
      onOpenChange(false)
    } catch (error) {
      setImportErrors(["Failed to import tasks. Please try again."])
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Tasks from Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Sample Section */}
          <div className="rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Download Sample File</h3>
                <p className="text-sm text-muted-foreground">
                  Get a template with the correct column format
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadSampleExcel()}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Sample CSV
              </Button>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {/* Error Messages */}
          {importErrors.length > 0 && (
            <div className="rounded-lg bg-destructive/10 p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                <div className="space-y-1">
                  <p className="font-medium text-destructive">Import Issues</p>
                  <ul className="space-y-1 text-sm text-destructive">
                    {importErrors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-chart-2/10 p-3">
                <CheckCircle className="h-5 w-5 text-chart-2" />
                <span className="text-sm font-medium text-foreground">
                  {preview.length} task(s) ready to import
                </span>
              </div>

              <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-input bg-background p-3">
                {preview.map((row, idx) => (
                  <div key={idx} className="space-y-1 border-b border-border pb-2 last:border-0">
                    <p className="font-medium text-foreground">{row.taskName}</p>
                    <p className="text-xs text-muted-foreground">
                      Project: {row.projectName} • Assigned to: {row.assignedTo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.startDate} to {row.endDate} • {row.priority} • {row.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={preview.length === 0 || importing}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {importing ? "Importing..." : "Import Tasks"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
