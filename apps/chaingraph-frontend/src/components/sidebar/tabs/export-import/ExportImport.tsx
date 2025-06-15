/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ChangeEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { $activeFlowMetadata } from '@/store/flow/stores'
import { useUnit } from 'effector-react'
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClipboardCopyIcon,
  DownloadIcon,
  FileIcon,
  UploadIcon,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useExportImport } from './hooks/useExportImport'

type ExportMode = 'all' | 'selected'

interface FeedbackMessage {
  type: 'success' | 'error'
  message: string
}

export function ExportImport() {
  const activeFlowMetadata = useUnit($activeFlowMetadata)

  // State
  const [exportMode, setExportMode] = useState<ExportMode>('all')
  const [importJson, setImportJson] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hook for export/import logic
  const {
    exportFlow,
    importFlow,
    selectedNodeCount,
    validateImportData,
  } = useExportImport()

  // Clear feedback after timeout
  const clearFeedback = useCallback(() => {
    setTimeout(() => setFeedback(null), 3000)
  }, [])

  // Handle export to clipboard
  const handleExportToClipboard = useCallback(async () => {
    try {
      const jsonData = await exportFlow(exportMode)
      await navigator.clipboard.writeText(jsonData)
      setFeedback({
        type: 'success',
        message: `Flow data copied to clipboard (${exportMode === 'all' ? 'all nodes' : `${selectedNodeCount} selected nodes`})`,
      })
      clearFeedback()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to export flow',
      })
      clearFeedback()
    }
  }, [exportFlow, exportMode, selectedNodeCount, clearFeedback])

  // Handle export to file
  const handleExportToFile = useCallback(async () => {
    try {
      const jsonData = await exportFlow(exportMode)
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const filename = `${activeFlowMetadata?.name || 'flow'}-${new Date().toISOString().slice(0, 10)}.json`
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setFeedback({
        type: 'success',
        message: `Flow exported to ${filename}`,
      })
      clearFeedback()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to export flow',
      })
      clearFeedback()
    }
  }, [exportFlow, exportMode, activeFlowMetadata, clearFeedback])

  // Handle file input
  const handleFileInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file)
      return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportJson(content)
    }
    reader.readAsText(file)
  }, [])

  // Handle import
  const handleImport = useCallback(async () => {
    if (!importJson.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please provide JSON data to import',
      })
      clearFeedback()
      return
    }

    setIsImporting(true)
    try {
      // Validate JSON first
      const validation = validateImportData(importJson)
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid import data')
      }

      // Import the flow
      const result = await importFlow(importJson)

      setFeedback({
        type: 'success',
        message: `Imported ${result.nodeCount} nodes and ${result.edgeCount} edges`,
      })
      clearFeedback()

      // Clear import field after success
      setImportJson('')
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to import flow',
      })
      clearFeedback()
    } finally {
      setIsImporting(false)
    }
  }, [importJson, importFlow, validateImportData, clearFeedback])

  // Check if we have an active flow
  if (!activeFlowMetadata) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <AlertCircleIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium mb-1">No Flow Selected</h3>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          Select a flow to export or import data
        </p>
      </div>
    )
  }

  const isExportDisabled = exportMode === 'selected' && selectedNodeCount === 0

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="px-4 py-4 space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
            {feedback.type === 'success'
              ? <CheckCircleIcon className="h-4 w-4" />
              : <AlertCircleIcon className="h-4 w-4" />}
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
        {/* Export Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Export Flow</h3>
            <p className="text-xs text-muted-foreground">
              Export your flow as JSON to share or backup
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-xs">Export mode</Label>
            <RadioGroup value={exportMode} onValueChange={value => setExportMode(value as ExportMode)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="text-xs font-normal cursor-pointer">
                  Export all nodes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="selected" />
                <Label htmlFor="selected" className="text-xs font-normal cursor-pointer">
                  Export selected nodes only (
                  {selectedNodeCount}
                  {' '}
                  selected)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleExportToClipboard}
              disabled={isExportDisabled}
            >
              <ClipboardCopyIcon className="w-3 h-3 mr-2" />
              Copy to Clipboard
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleExportToFile}
              disabled={isExportDisabled}
            >
              <DownloadIcon className="w-3 h-3 mr-2" />
              Download
            </Button>
          </div>

          {isExportDisabled && (
            <p className="text-xs text-destructive">
              No nodes selected. Select nodes in the flow editor first.
            </p>
          )}
        </div>

        <Separator />

        {/* Import Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Import Flow</h3>
            <p className="text-xs text-muted-foreground">
              Import nodes and edges from a JSON file
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="import-file" className="text-xs">
              Upload JSON file
            </Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInput}
                className="hidden"
                aria-label="Choose JSON file"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                type="button"
              >
                <FileIcon className="w-3 h-3 mr-2" />
                Choose File
              </Button>
            </div>

            <div className="relative">
              <Label htmlFor="import-json" className="text-xs">
                Or paste JSON data
              </Label>
              <Textarea
                id="import-json"
                placeholder="Paste your flow JSON here..."
                className="mt-1 min-h-[120px] w-full text-xs font-mono"
                value={importJson}
                onChange={e => setImportJson(e.target.value)}
              />
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={handleImport}
              disabled={!importJson.trim() || isImporting}
            >
              <UploadIcon className="w-3 h-3 mr-2" />
              {isImporting ? 'Importing...' : 'Import Flow'}
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
