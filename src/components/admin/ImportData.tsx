'use client'

/**
 * Import Data Component
 *
 * Admin interface for importing data from external platforms:
 * - Slack, Discord, CSV, JSON
 * - Complete import wizard with progress tracking
 * - Field mapping, validation, and error handling
 */

import React, { useState, useCallback } from 'react'
import {Upload, AlertCircle, CheckCircle, Download, FileText, MessageSquare, Users, Hash} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { SlackImporter } from '@/lib/import/slack-importer'
import { DiscordImporter } from '@/lib/import/discord-importer'
import { GenericImporter } from '@/lib/import/generic-importer'
import type {
  ImportSource,
  ImportOptions,
  ImportProgress as ImportProgressType,
  ImportStats,
  ImportError,
  ImportWarning,
} from '@/lib/import/types'

type WizardStep = 'source' | 'upload' | 'options' | 'preview' | 'importing' | 'completed'

export default function ImportData() {
  const [step, setStep] = useState<WizardStep>('source')
  const [source, setSource] = useState<ImportSource>('slack')
  const [file, setFile] = useState<File | null>(null)
  const [options, setOptions] = useState<ImportOptions>({
    importUsers: true,
    importChannels: true,
    importMessages: true,
    importFiles: true,
    importReactions: true,
    importThreads: true,
    preserveIds: false,
    overwriteExisting: false,
  })
  const [progress, setProgress] = useState<ImportProgressType | null>(null)
  const [stats, setStats] = useState<ImportStats | null>(null)
  const [importer, setImporter] = useState<SlackImporter | DiscordImporter | GenericImporter | null>(null)

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }, [])

  // Start import process
  const startImport = useCallback(async () => {
    if (!file) return

    setStep('importing')

    try {
      let importerInstance: SlackImporter | DiscordImporter | GenericImporter

      // Create appropriate importer
      if (source === 'slack') {
        importerInstance = new SlackImporter(options)
        const slackData = await importerInstance.parseSlackExport(file)
        setImporter(importerInstance)

        const result = await importerInstance.import(slackData, (prog) => {
          setProgress(prog)
        })

        setStats(result.stats)
        setStep('completed')
      } else if (source === 'discord') {
        importerInstance = new DiscordImporter(options)
        const discordData = await importerInstance.parseDiscordExport(file)
        setImporter(importerInstance)

        const result = await importerInstance.import(discordData, (prog) => {
          setProgress(prog)
        })

        setStats(result.stats)
        setStep('completed')
      } else if (source === 'csv') {
        importerInstance = new GenericImporter(options)
        const genericData = await importerInstance.parseCSV(file)
        setImporter(importerInstance)

        const result = await importerInstance.import(genericData, (prog) => {
          setProgress(prog)
        })

        setStats(result.stats)
        setStep('completed')
      } else if (source === 'json') {
        importerInstance = new GenericImporter(options)
        const genericData = await importerInstance.parseJSON(file)
        setImporter(importerInstance)

        const result = await importerInstance.import(genericData, (prog) => {
          setProgress(prog)
        })

        setStats(result.stats)
        setStep('completed')
      }
    } catch (error) {
      console.error('Import failed:', error)
      setStep('upload')
    }
  }, [file, source, options])

  // Cancel import
  const cancelImport = useCallback(() => {
    if (importer) {
      importer.cancel()
    }
    setStep('source')
    setFile(null)
    setProgress(null)
    setStats(null)
    setImporter(null)
  }, [importer])

  // Reset wizard
  const resetWizard = useCallback(() => {
    setStep('source')
    setFile(null)
    setProgress(null)
    setStats(null)
    setImporter(null)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Import Data</h2>
        <p className="text-muted-foreground">
          Import users, channels, and messages from other platforms
        </p>
      </div>

      {/* Wizard Steps Indicator */}
      <div className="flex items-center justify-between">
        {[
          { id: 'source', label: 'Source' },
          { id: 'upload', label: 'Upload' },
          { id: 'options', label: 'Options' },
          { id: 'importing', label: 'Import' },
          { id: 'completed', label: 'Complete' },
        ].map((s, i, arr) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step === s.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : getStepIndex(step) > i
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                }`}
              >
                {getStepIndex(step) > i ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className="text-xs mt-2">{s.label}</span>
            </div>
            {i < arr.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  getStepIndex(step) > i ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Source */}
      {step === 'source' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Select Import Source</h3>
          <Tabs value={source} onValueChange={(v) => setSource(v as ImportSource)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="slack">Slack</TabsTrigger>
              <TabsTrigger value="discord">Discord</TabsTrigger>
              <TabsTrigger value="csv">CSV</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="slack" className="space-y-4">
              <Alert>
                <AlertDescription>
                  <h4 className="font-semibold mb-2">How to export from Slack:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to Slack workspace settings</li>
                    <li>Navigate to Import/Export Data</li>
                    <li>Choose Export and select date range</li>
                    <li>Download the ZIP file</li>
                    <li>Upload the exported file here</li>
                  </ol>
                </AlertDescription>
              </Alert>
              <Button onClick={() => setStep('upload')}>Continue</Button>
            </TabsContent>

            <TabsContent value="discord" className="space-y-4">
              <Alert>
                <AlertDescription>
                  <h4 className="font-semibold mb-2">How to export from Discord:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Use DiscordChatExporter tool</li>
                    <li>Select your server and channels</li>
                    <li>Export as JSON format</li>
                    <li>Upload the exported file here</li>
                  </ol>
                  <div className="mt-2">
                    <a
                      href="https://github.com/Tyrrrz/DiscordChatExporter"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download DiscordChatExporter
                    </a>
                  </div>
                </AlertDescription>
              </Alert>
              <Button onClick={() => setStep('upload')}>Continue</Button>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <Alert>
                <AlertDescription>
                  <h4 className="font-semibold mb-2">CSV Format Requirements:</h4>
                  <p className="text-sm mb-2">
                    Your CSV should include columns for users, channels, or messages.
                  </p>
                  <p className="text-sm">
                    Common columns: id, email, username, name, channel_id, content, created_at
                  </p>
                </AlertDescription>
              </Alert>
              <Button onClick={() => setStep('upload')}>Continue</Button>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <Alert>
                <AlertDescription>
                  <h4 className="font-semibold mb-2">JSON Format Requirements:</h4>
                  <p className="text-sm mb-2">
                    Your JSON should contain arrays of users, channels, or messages.
                  </p>
                  <pre className="text-xs bg-muted p-2 rounded mt-2">
{`{
  "users": [...],
  "channels": [...],
  "messages": [...]
}`}
                  </pre>
                </AlertDescription>
              </Alert>
              <Button onClick={() => setStep('upload')}>Continue</Button>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Step 2: Upload File */}
      {step === 'upload' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upload File</h3>

          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept={
                source === 'csv'
                  ? '.csv'
                  : source === 'json'
                  ? '.json'
                  : '.zip,.json'
              }
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">
                {file ? file.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {source === 'csv' && 'CSV files only'}
                {source === 'json' && 'JSON files only'}
                {(source === 'slack' || source === 'discord') && 'ZIP or JSON files'}
              </p>
              {file && (
                <Badge className="mt-4">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              )}
            </label>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setStep('source')}>
              Back
            </Button>
            <Button onClick={() => setStep('options')} disabled={!file}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Import Options */}
      {step === 'options' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Import Options</h3>

          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">What to import</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="import-users">Import Users</Label>
                  </div>
                  <Switch
                    id="import-users"
                    checked={options.importUsers}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, importUsers: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="import-channels">Import Channels</Label>
                  </div>
                  <Switch
                    id="import-channels"
                    checked={options.importChannels}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, importChannels: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="import-messages">Import Messages</Label>
                  </div>
                  <Switch
                    id="import-messages"
                    checked={options.importMessages}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, importMessages: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="import-files">Import Files</Label>
                  </div>
                  <Switch
                    id="import-files"
                    checked={options.importFiles}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, importFiles: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Additional Options</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="import-reactions">Import Reactions</Label>
                  <Switch
                    id="import-reactions"
                    checked={options.importReactions}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, importReactions: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="import-threads">Import Threads</Label>
                  <Switch
                    id="import-threads"
                    checked={options.importThreads}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, importThreads: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="overwrite-existing">Overwrite Existing</Label>
                  <Switch
                    id="overwrite-existing"
                    checked={options.overwriteExisting}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, overwriteExisting: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button onClick={startImport}>Start Import</Button>
          </div>
        </Card>
      )}

      {/* Step 4: Importing */}
      {step === 'importing' && progress && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Importing Data</h3>

          <div className="space-y-6">
            {/* Overall Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{progress.currentStep}</span>
                <span className="text-sm text-muted-foreground">
                  {progress.progress}%
                </span>
              </div>
              <Progress value={progress.progress} />
            </div>

            {/* Step Progress */}
            <div className="text-sm text-muted-foreground">
              Step {progress.currentStepNumber} of {progress.totalSteps}
            </div>

            {/* Items Progress */}
            {progress.itemsTotal > 0 && (
              <div className="text-sm">
                <span className="font-medium">{progress.itemsProcessed}</span> of{' '}
                <span className="font-medium">{progress.itemsTotal}</span> items processed
              </div>
            )}

            {/* Warnings */}
            {progress.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">
                    {progress.warnings.length} warning(s)
                  </div>
                  <ul className="text-sm mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {progress.warnings.slice(-5).map((warning, i) => (
                      <li key={i}>• {warning.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Errors */}
            {progress.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">{progress.errors.length} error(s)</div>
                  <ul className="text-sm mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {progress.errors.slice(-5).map((error, i) => (
                      <li key={i}>• {error.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button variant="destructive" onClick={cancelImport}>
              Cancel Import
            </Button>
          </div>
        </Card>
      )}

      {/* Step 5: Completed */}
      {step === 'completed' && stats && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-semibold">Import Completed</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatsCard
              label="Users"
              imported={stats.usersImported}
              skipped={stats.usersSkipped}
              failed={stats.usersFailed}
            />
            <StatsCard
              label="Channels"
              imported={stats.channelsImported}
              skipped={stats.channelsSkipped}
              failed={stats.channelsFailed}
            />
            <StatsCard
              label="Messages"
              imported={stats.messagesImported}
              skipped={stats.messagesSkipped}
              failed={stats.messagesFailed}
            />
            <StatsCard
              label="Files"
              imported={stats.filesImported}
              skipped={stats.filesSkipped}
              failed={stats.filesFailed}
            />
          </div>

          {stats.reactionsImported > 0 && (
            <div className="text-sm text-muted-foreground mb-2">
              {stats.reactionsImported} reactions imported
            </div>
          )}

          {stats.threadsImported > 0 && (
            <div className="text-sm text-muted-foreground mb-4">
              {stats.threadsImported} thread replies imported
            </div>
          )}

          <div className="text-sm text-muted-foreground mb-6">
            Total duration: {(stats.totalDuration / 1000).toFixed(1)}s
          </div>

          {progress && progress.errors.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">
                  Import completed with {progress.errors.length} error(s)
                </div>
                <details className="text-sm mt-2">
                  <summary className="cursor-pointer">View errors</summary>
                  <ul className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                    {progress.errors.map((error, i) => (
                      <li key={i} className="ml-4">
                        • {error.message}
                        {error.details && (
                          <div className="text-xs ml-2 mt-1">{error.details}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={resetWizard}>Import More Data</Button>
        </Card>
      )}
    </div>
  )
}

// Helper component for stats display
function StatsCard({
  label,
  imported,
  skipped,
  failed,
}: {
  label: string
  imported: number
  skipped: number
  failed: number
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-sm font-medium text-muted-foreground mb-2">{label}</div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm">Imported</span>
          <span className="text-lg font-bold text-green-500">{imported}</span>
        </div>
        {skipped > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Skipped</span>
            <span>{skipped}</span>
          </div>
        )}
        {failed > 0 && (
          <div className="flex items-center justify-between text-xs text-destructive">
            <span>Failed</span>
            <span>{failed}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper to get step index
function getStepIndex(step: WizardStep): number {
  const steps: WizardStep[] = ['source', 'upload', 'options', 'importing', 'completed']
  return steps.indexOf(step)
}
