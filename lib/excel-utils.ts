// Excel utility functions for generating sample files and importing data

export interface ExcelTaskRow {
  rowNumber: number
  projectName?: string
  projectId?: string
  taskName?: string
  description?: string
  assignedTo?: string
  assignees?: string
  dependencies?: string
  startDate?: string
  endDate?: string
  dueDate?: string
  status?: string
  priority?: string
  remarks?: string
  notes?: string
  links?: string
}

// Generate a sample Excel file (CSV format for browser compatibility)
export function generateSampleExcel(): string {
  const headers = [
    "Project Name",
    "Task Name",
    "Description",
    "Assigned To",
    "Dependencies (Task IDs, comma-separated)",
    "Start Date",
    "End Date",
    "Status",
    "Priority",
  ]

  const sampleData: Omit<ExcelTaskRow, "rowNumber">[] = [
    {
      projectName: "Website Redesign",
      taskName: "Homepage Design",
      description: "Create homepage mockup and design",
      assignedTo: "Akshay Singh",
      dependencies: "",
      startDate: "2026-04-01",
      endDate: "2026-04-15",
      status: "in-progress",
      priority: "high",
    },
    {
      projectName: "Website Redesign",
      taskName: "Navigation Component",
      description: "Build responsive navigation",
      assignedTo: "Sant Prasad Gupta, Tech Team",
      dependencies: "1",
      startDate: "2026-04-10",
      endDate: "2026-04-20",
      status: "todo",
      priority: "high",
    },
    {
      projectName: "Mobile App Development",
      taskName: "API Integration",
      description: "Integrate backend APIs",
      assignedTo: "Backend Team",
      dependencies: "",
      startDate: "2026-04-05",
      endDate: "2026-04-30",
      status: "todo",
      priority: "high",
    },
  ]

  // Convert to CSV
  let csv = headers.map((h) => `"${h}"`).join(",") + "\n"

  sampleData.forEach((row) => {
    csv += [
      `"${row.projectName}"`,
      `"${row.taskName}"`,
      `"${row.description}"`,
      `"${row.assignedTo}"`,
      `"${row.dependencies}"`,
      `"${row.startDate}"`,
      `"${row.endDate}"`,
      `"${row.status}"`,
      `"${row.priority}"`,
    ].join(",") + "\n"
  })

  return csv
}

// Download sample CSV file
export function downloadSampleExcel(): void {
  const csv = generateSampleExcel()
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", "itest-content-team-sample.csv")
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Parse CSV content
export function parseCSV(content: string): ExcelTaskRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map(normalizeHeader)
  const rows: ExcelTaskRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue

    const row: ExcelTaskRow = { rowNumber: i + 1 }

    for (let columnIndex = 0; columnIndex < headers.length; columnIndex++) {
      const header = headers[columnIndex]
      const value = (values[columnIndex] ?? "").trim()
      if (!value) continue

      if (header === "projectName") row.projectName = value
      if (header === "projectId") row.projectId = value
      if (header === "taskName") row.taskName = value
      if (header === "description") row.description = value
      if (header === "assignedTo") row.assignedTo = value
      if (header === "assignees") row.assignees = value
      if (header === "dependencies") row.dependencies = value
      if (header === "startDate") row.startDate = value
      if (header === "endDate") row.endDate = value
      if (header === "dueDate") row.dueDate = value
      if (header === "status") row.status = value
      if (header === "priority") row.priority = value
      if (header === "remarks") row.remarks = value
      if (header === "notes") row.notes = value
      if (header === "links") row.links = value
    }

    rows.push(row)
  }

  return rows
}

// Helper function to parse CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

function normalizeHeader(header: string): string {
  const normalized = header.trim().toLowerCase().replace(/\s+/g, " ")
  const aliases: Record<string, string> = {
    "project": "projectName",
    "project name": "projectName",
    "project_name": "projectName",
    "project id": "projectId",
    "project_id": "projectId",
    "task": "taskName",
    "task name": "taskName",
    "task_name": "taskName",
    "title": "taskName",
    "description": "description",
    "assigned to": "assignedTo",
    "assignee": "assignees",
    "assignees": "assignees",
    "dependencies": "dependencies",
    "start date": "startDate",
    "start_date": "startDate",
    "end date": "endDate",
    "end_date": "endDate",
    "due date": "dueDate",
    "due_date": "dueDate",
    "status": "status",
    "priority": "priority",
    "remarks": "remarks",
    "notes": "notes",
    "links": "links",
  }

  return aliases[normalized] ?? normalized
}
