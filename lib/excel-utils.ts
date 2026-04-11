// Excel utility functions for generating sample files and importing data

export interface ExcelTaskRow {
  projectName: string
  taskName: string
  description: string
  assignedTo: string
  dependencies: string
  startDate: string
  endDate: string
  status: string
  priority: string
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

  const sampleData: ExcelTaskRow[] = [
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
  const lines = content.split("\n").filter((line) => line.trim())
  if (lines.length < 2) return []

  // Skip header and parse data rows
  const rows: ExcelTaskRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values = parseCSVLine(line)

    if (values.length < 9) continue

    rows.push({
      projectName: values[0],
      taskName: values[1],
      description: values[2],
      assignedTo: values[3],
      dependencies: values[4],
      startDate: values[5],
      endDate: values[6],
      status: values[7],
      priority: values[8],
    })
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
