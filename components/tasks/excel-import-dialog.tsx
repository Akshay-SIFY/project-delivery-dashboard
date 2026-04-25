"use client"

import { useMemo, useState } from "react"
import { Download, Upload, AlertCircle, CheckCircle, FileWarning } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { downloadSampleExcel, parseCSV, type ExcelTaskRow } from "@/lib/excel-utils"

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ImportFailure {
  rowNumber: number
  reason: string
}

interface ImportResponse {
  totalRows: number
  importedCount: number
  failedCount: number
  failedRows: ImportFailure[]
}

export function ExcelImportDialog({ open, onOpenChange }: ExcelImportDialogProps) {
  const { loadTasks } = useStore()
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ExcelTaskRow[]>([])
  const [parsingError, setParsingError] = useState<string | null>(null)
  const [importFailures, setImportFailures] = useState<ImportFailure[]>([])
  const [importSummary, setImportSummary] = useState<ImportResponse | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const totalRows = rows.length

  const failedCsvContent = useMemo(() => {
    if (importFailures.length === 0) return ""
    const header = "row_number,reason"
    const lines = importFailures.map((failure) => {
      const escapedReason = `"${failure.reason.replace(/"/g, '""')}"`
      return `${failure.rowNumber},${escapedReason}`
    })

    return `${header}\n${lines.join("\n")}`
  }, [importFailures])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setRows([])
    setParsingError(null)
    setImportFailures([])
    setImportSummary(null)
    setProgress(0)

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setParsingError("Only CSV import is supported in this build. Please export the Excel file as CSV and retry.")
      return
    }

    try {
      const text = await selectedFile.text()
      const parsedRows = parseCSV(text)
      if (parsedRows.length === 0) {
        setParsingError("No task rows were found in the file.")
        return
      }

      setRows(parsedRows)
    } catch (error) {
      setParsingError(error instanceof Error ? error.message : "Failed to read the selected file")
    }
  }

  const handleImport = async () => {
    if (rows.length === 0) {
      setParsingError("No rows to import")
      return
    }

    setImporting(true)
    setProgress(5)
    setParsingError(null)
    setImportFailures([])
    setImportSummary(null)

    try {
      setProgress(20)
      const response = await fetch("/api/tasks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: rows }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : "Failed to import tasks"
        throw new Error(message)
      }

      const summary = payload as ImportResponse
      setImportSummary(summary)
      setImportFailures(Array.isArray(summary.failedRows) ? summary.failedRows : [])
      setProgress(100)

      await loadTasks()
    } catch (error) {
      setParsingError(error instanceof Error ? error.message : "Failed to import tasks")
      setProgress(0)
    } finally {
      setImporting(false)
    }
  }

  const downloadFailedRowsReport = () => {
    if (!failedCsvContent) return

    const blob = new Blob([failedCsvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", "task-import-failed-rows.csv")
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) {
          setFile(null)
          setRows([])
          setParsingError(null)
          setImportSummary(null)
          setImportFailures([])
          setProgress(0)
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Tasks from Excel/CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium text-foreground">Download Sample File</h3>
                <p className="text-sm text-muted-foreground">
                  Use this template for the expected column names.
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
            />
            {file && <p className="text-xs text-muted-foreground">Selected file: {file.name}</p>}
          </div>

          {parsingError && (
            <div className="rounded-lg bg-destructive/10 p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{parsingError}</p>
              </div>
            </div>
          )}

          {rows.length > 0 && !importSummary && (
            <div className="rounded-lg bg-chart-2/10 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-chart-2" />
                <span className="text-sm font-medium text-foreground">
                  Ready to import {rows.length} task(s)
                </span>
              </div>
            </div>
          )}

          {importing && (
            <div className="space-y-2 rounded-lg border border-input bg-background p-3">
              <p className="text-sm font-medium text-foreground">Importing tasks...</p>
              <div className="h-2 w-full overflow-hidden rounded bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Progress: {progress}%</p>
            </div>
          )}

          {importSummary && (
            <div className="space-y-3 rounded-lg border border-input bg-background p-4">
              <p className="text-sm font-semibold text-foreground">Import Summary</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Total rows detected: {importSummary.totalRows}</li>
                <li>Successfully imported: {importSummary.importedCount}</li>
                <li>Failed rows: {importSummary.failedCount}</li>
              </ul>

              {importFailures.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-destructive">Failed rows report</p>
                    <Button type="button" variant="outline" size="sm" onClick={downloadFailedRowsReport}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Failed Rows
                    </Button>
                  </div>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-md bg-destructive/10 p-2 text-sm">
                    {importFailures.map((failure) => (
                      <p key={`${failure.rowNumber}-${failure.reason}`} className="text-destructive">
                        Row {failure.rowNumber} failed: {failure.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {importFailures.length === 0 && (
                <div className="flex items-center gap-2 rounded-md bg-chart-2/10 p-2 text-sm text-chart-2">
                  <FileWarning className="h-4 w-4" />
                  All rows imported successfully.
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleImport} disabled={totalRows === 0 || importing} className="gap-2">
              <Upload className="h-4 w-4" />
              {importing ? "Importing..." : "Import Tasks"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
