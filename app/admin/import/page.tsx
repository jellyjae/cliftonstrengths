"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import Papa from "papaparse"

interface CSVRow {
  theme: string
  aspect: string
  prompt_text: string
}

interface ValidationResult {
  isValid: boolean
  totalRows: number
  invalidRows: Array<{
    row: number
    data: CSVRow
    errors: string[]
  }>
  invalidPercentage: number
  headerErrors: string[]
}

interface ImportResult {
  inserted: number
  skipped: number
  invalid: CSVRow[]
  errors: string[]
}

const VALID_ASPECTS = ["career", "social", "financial", "physical", "community"]
const REQUIRED_HEADERS = ["theme", "aspect", "prompt_text"]
const MAX_INVALID_PERCENTAGE = 2

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setResult(null)
      setErrors([])
      setValidationResult(null)
    }
  }

  const validateCSV = async (csvText: string): Promise<ValidationResult> => {
    const supabase = createClient()

    const { data: themes, error: themesError } = await supabase.from("themes").select("name")
    if (themesError) throw themesError

    const validThemes = new Set(themes.map((t) => t.name))

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const headerErrors: string[] = []
          const invalidRows: Array<{
            row: number
            data: CSVRow
            errors: string[]
          }> = []

          const headers = results.meta.fields || []
          const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
          const extraHeaders = headers.filter((h) => !REQUIRED_HEADERS.includes(h))

          if (missingHeaders.length > 0) {
            headerErrors.push(`Missing required headers: ${missingHeaders.join(", ")}`)
          }
          if (extraHeaders.length > 0) {
            headerErrors.push(`Unexpected headers: ${extraHeaders.join(", ")}`)
          }
          if (headers.length !== REQUIRED_HEADERS.length) {
            headerErrors.push(`Expected exactly ${REQUIRED_HEADERS.length} headers, got ${headers.length}`)
          }

          const rows = results.data as CSVRow[]
          const totalRows = rows.filter((row) => row.theme || row.aspect || row.prompt_text).length

          rows.forEach((row, index) => {
            if (!row.theme && !row.aspect && !row.prompt_text) return

            const rowErrors: string[] = []

            if (!row.theme?.trim()) {
              rowErrors.push("Missing theme")
            } else if (!validThemes.has(row.theme.trim())) {
              rowErrors.push(`Invalid theme: ${row.theme}`)
            }

            if (!row.aspect?.trim()) {
              rowErrors.push("Missing aspect")
            } else if (!VALID_ASPECTS.includes(row.aspect.trim().toLowerCase())) {
              rowErrors.push(`Invalid aspect: ${row.aspect}. Must be one of: ${VALID_ASPECTS.join(", ")}`)
            }

            if (!row.prompt_text?.trim()) {
              rowErrors.push("Missing prompt_text")
            } else if (row.prompt_text.trim().length < 10) {
              rowErrors.push("Prompt text too short (minimum 10 characters)")
            }

            if (rowErrors.length > 0) {
              invalidRows.push({
                row: index + 1,
                data: row,
                errors: rowErrors,
              })
            }
          })

          const invalidPercentage = totalRows > 0 ? (invalidRows.length / totalRows) * 100 : 0
          const isValid = headerErrors.length === 0 && invalidPercentage <= MAX_INVALID_PERCENTAGE

          resolve({
            isValid,
            totalRows,
            invalidRows,
            invalidPercentage,
            headerErrors,
          })
        },
        error: (error) => {
          resolve({
            isValid: false,
            totalRows: 0,
            invalidRows: [],
            invalidPercentage: 100,
            headerErrors: [`CSV parsing error: ${error.message}`],
          })
        },
      })
    })
  }

  const handleValidate = async () => {
    if (!file) return

    setValidating(true)
    setValidationResult(null)
    setErrors([])

    try {
      const csvText = await file.text()
      const validation = await validateCSV(csvText)
      setValidationResult(validation)
    } catch (error) {
      console.error("Validation error:", error)
      setErrors([error instanceof Error ? error.message : "Unknown validation error"])
    } finally {
      setValidating(false)
    }
  }

  const handleImportFromURL = async () => {
    const csvUrl =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/strengths_wellbeing_prompts_final-c1SNyuU84TqIOTdAEEaMReL0XJ5sd8.csv"

    setImporting(true)
    setResult(null)
    setErrors([])

    try {
      const response = await fetch(csvUrl)
      const csvText = await response.text()

      const validation = await validateCSV(csvText)
      if (!validation.isValid) {
        setErrors([
          `CSV validation failed: ${validation.invalidPercentage.toFixed(1)}% invalid rows (max ${MAX_INVALID_PERCENTAGE}% allowed)`,
          ...validation.headerErrors,
        ])
        return
      }

      await processCSV(csvText)
    } catch (error) {
      console.error("Error fetching CSV:", error)
      setErrors(["Failed to fetch CSV from URL"])
    } finally {
      setImporting(false)
    }
  }

  const handleImport = async () => {
    if (!file || !validationResult?.isValid) return

    setImporting(true)
    setResult(null)
    setErrors([])

    try {
      const csvText = await file.text()
      await processCSV(csvText)
    } catch (error) {
      console.error("Import error:", error)
      setErrors([error instanceof Error ? error.message : "Unknown error"])
    } finally {
      setImporting(false)
    }
  }

  const processCSV = async (csvText: string) => {
    const supabase = createClient()

    const { data: themes, error: themesError } = await supabase.from("themes").select("id, name")

    if (themesError) throw themesError

    const themeMap = new Map(themes.map((t) => [t.name, t.id]))

    Papa.parse(csvText, {
      header: true,
      complete: async (results) => {
        const rows = results.data as CSVRow[]
        const validRows: Array<{
          theme_id: string
          aspect: string
          prompt_text: string
          tags: string[] | null
        }> = []
        const invalidRows: CSVRow[] = []
        const currentErrors: string[] = []

        for (const row of rows) {
          const theme = row.theme?.trim()
          const aspect = row.aspect?.trim().toLowerCase()
          const prompt = row.prompt_text?.trim()

          if (!theme || !aspect || !prompt) {
            invalidRows.push(row)
            continue
          }

          const themeId = themeMap.get(theme)
          if (!themeId) {
            invalidRows.push(row)
            currentErrors.push(`Invalid theme: ${theme}`)
            continue
          }

          if (!VALID_ASPECTS.includes(aspect)) {
            invalidRows.push(row)
            currentErrors.push(`Invalid aspect: ${aspect}`)
            continue
          }

          if (prompt.length < 10) {
            invalidRows.push(row)
            currentErrors.push(`Prompt too short: ${prompt.substring(0, 50)}...`)
            continue
          }

          validRows.push({
            theme_id: themeId,
            aspect,
            prompt_text: prompt,
            tags: null,
          })
        }

        let inserted = 0
        let skipped = 0

        if (validRows.length > 0) {
          const { data, error } = await supabase
            .from("prompts")
            .upsert(validRows, {
              onConflict: "theme_id,aspect,prompt_text",
              ignoreDuplicates: true,
            })
            .select()

          if (error) {
            console.error("Insert error:", error)
            currentErrors.push(`Database error: ${error.message}`)
          } else {
            inserted = data?.length || 0
            skipped = validRows.length - inserted
          }
        }

        setErrors(currentErrors)
        setResult({
          inserted,
          skipped,
          invalid: invalidRows,
          errors: [...new Set(currentErrors)],
        })
      },
      error: (error) => {
        const errorMsg = `CSV parsing error: ${error.message}`
        setErrors([errorMsg])
        setResult({
          inserted: 0,
          skipped: 0,
          invalid: [],
          errors: [errorMsg],
        })
      },
    })
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Import Prompts from CSV</CardTitle>
          <CardDescription>Upload a CSV file with exactly these columns: theme, aspect, prompt_text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Button
              onClick={handleImportFromURL}
              disabled={importing}
              className="w-full bg-transparent"
              variant="outline"
            >
              {importing ? "Importing..." : "Import from Provided CSV URL"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or upload file</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
            <p className="text-sm text-muted-foreground">
              Required columns: theme, aspect, prompt_text (exactly these headers)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Valid Aspects</Label>
            <div className="flex flex-wrap gap-2">
              {VALID_ASPECTS.map((aspect) => (
                <Badge key={aspect} variant="secondary">
                  {aspect}
                </Badge>
              ))}
            </div>
          </div>

          {file && !validationResult && (
            <Button onClick={handleValidate} disabled={validating} className="w-full bg-transparent" variant="outline">
              {validating ? "Validating..." : "Validate CSV"}
            </Button>
          )}

          {validationResult && (
            <div className="space-y-4">
              <Alert className={validationResult.isValid ? "border-green-500" : "border-red-500"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {validationResult.isValid ? "✅ Validation Passed" : "❌ Validation Failed"}
                      </span>
                      <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                        {validationResult.invalidPercentage.toFixed(1)}% invalid
                      </Badge>
                    </div>

                    <div className="text-sm">
                      Total rows: {validationResult.totalRows} | Invalid rows: {validationResult.invalidRows.length} |
                      Max allowed: {MAX_INVALID_PERCENTAGE}%
                    </div>

                    {validationResult.headerErrors.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-medium text-red-600">Header Issues:</p>
                        {validationResult.headerErrors.map((error, i) => (
                          <p key={i} className="text-sm">
                            • {error}
                          </p>
                        ))}
                      </div>
                    )}

                    {validationResult.invalidRows.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-medium text-red-600">Row-level Errors (first 5):</p>
                        {validationResult.invalidRows.slice(0, 5).map((invalid, i) => (
                          <div key={i} className="text-sm border-l-2 border-red-300 pl-2">
                            <p className="font-medium">Row {invalid.row}:</p>
                            {invalid.errors.map((error, j) => (
                              <p key={j} className="text-red-600">
                                • {error}
                              </p>
                            ))}
                          </div>
                        ))}
                        {validationResult.invalidRows.length > 5 && (
                          <p className="text-sm">...and {validationResult.invalidRows.length - 5} more invalid rows</p>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {validationResult.isValid && (
                <Button onClick={handleImport} disabled={importing} className="w-full">
                  {importing ? "Importing..." : "Import Validated CSV"}
                </Button>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">{result.inserted}</div>
                    <p className="text-sm text-muted-foreground">Inserted</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                    <p className="text-sm text-muted-foreground">Skipped</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">{result.invalid.length}</div>
                    <p className="text-sm text-muted-foreground">Invalid</p>
                  </CardContent>
                </Card>
              </div>

              {result.errors.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Errors:</p>
                      {result.errors.map((error, i) => (
                        <p key={i} className="text-sm">
                          • {error}
                        </p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {result.invalid.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Invalid rows (first 5):</p>
                      {result.invalid.slice(0, 5).map((row, i) => (
                        <p key={i} className="text-sm font-mono">
                          {JSON.stringify(row)}
                        </p>
                      ))}
                      {result.invalid.length > 5 && <p className="text-sm">...and {result.invalid.length - 5} more</p>}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
