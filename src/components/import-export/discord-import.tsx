'use client'

import * as React from 'react'
import {
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Hash,
  MessageSquare,
  ArrowRight,
  Info,
  ExternalLink,
  Plus,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type {
  DiscordExportData,
  ImportConfig,
  ImportPreview,
  ImportError,
  ImportWarning,
} from '@/lib/import-export/types'
import {
  DiscordParser,
  parseDiscordExportFile,
  parseMultipleDiscordExports,
} from '@/lib/import-export/discord-parser'
import { createDefaultImportConfig } from '@/lib/import-export/import-service'

// ============================================================================
// TYPES
// ============================================================================

interface DiscordImportProps {
  onImportComplete?: (result: { success: boolean; stats: Record<string, number> }) => void
  onCancel?: () => void
}

type ImportStep = 'upload' | 'review' | 'mapping' | 'importing' | 'complete'

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DiscordImport({ onImportComplete, onCancel }: DiscordImportProps) {
  const [step, setStep] = React.useState<ImportStep>('upload')
  const [files, setFiles] = React.useState<File[]>([])
  const [data, setData] = React.useState<DiscordExportData | null>(null)
  const [preview, setPreview] = React.useState<ImportPreview | null>(null)
  const [config, setConfig] = React.useState<ImportConfig>(createDefaultImportConfig('discord'))
  const [errors, setErrors] = React.useState<ImportError[]>([])
  const [warnings, setWarnings] = React.useState<ImportWarning[]>([])
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [importProgress, setImportProgress] = React.useState(0)
  const [selectedChannels, setSelectedChannels] = React.useState<Set<string>>(new Set())

  const inputRef = React.useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles).filter((f) => f.name.endsWith('.json'))
    if (fileArray.length === 0) return

    setFiles((prev) => [...prev, ...fileArray])
  }

  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Process all uploaded files
  const processFiles = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    setErrors([])
    setWarnings([])

    try {
      let result
      if (files.length === 1) {
        result = await parseDiscordExportFile(files[0])
      } else {
        result = await parseMultipleDiscordExports(files)
      }

      setData(result.data)
      setPreview(result.preview)
      setErrors(result.errors)
      setWarnings(result.warnings)

      // Select all channels by default
      const allChannelIds = result.data.channels.map((c) => c.id)
      setSelectedChannels(new Set(allChannelIds))

      // Move to review step
      setStep('review')
    } catch (error) {
      setErrors([
        {
          code: 'PARSE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to parse Discord export',
        },
      ])
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle channel selection toggle
  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev)
      if (next.has(channelId)) {
        next.delete(channelId)
      } else {
        next.add(channelId)
      }
      return next
    })
  }

  // Handle import options change
  const handleOptionChange = (key: keyof ImportConfig['options'], value: boolean) => {
    setConfig((prev) => ({
      ...prev,
      options: { ...prev.options, [key]: value },
    }))
  }

  // Start the import process
  const startImport = async () => {
    if (!data || !preview) return

    setStep('importing')
    setImportProgress(0)

    try {
      // Update config with selected channels
      const importConfig: ImportConfig = {
        ...config,
        options: {
          ...config.options,
          channelFilter: Array.from(selectedChannels),
        },
      }

      // Make API call to start import
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'discord',
          config: importConfig,
          data: {
            users: preview.users,
            channels: preview.channels.filter((c) => selectedChannels.has(c.externalId)),
            messages: preview.messages.filter((m) => selectedChannels.has(m.channelId)),
          },
        }),
      })

      // Simulate progress for demo
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        setImportProgress(i)
      }

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result = await response.json()

      setStep('complete')
      onImportComplete?.({
        success: true,
        stats: result.stats,
      })
    } catch (error) {
      setErrors([
        {
          code: 'IMPORT_ERROR',
          message: error instanceof Error ? error.message : 'Import failed',
        },
      ])
    }
  }

  // Render upload step
  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How to export from Discord</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p className="text-sm">
            Discord does not have a built-in export feature. You can use tools like
            DiscordChatExporter to export your server data.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
            <li>Download DiscordChatExporter</li>
            <li>Authenticate with your Discord account</li>
            <li>Select the server and channels to export</li>
            <li>Export as JSON format</li>
            <li>Upload the JSON files here</li>
          </ol>
          <a
            href="https://github.com/Tyrrrz/DiscordChatExporter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 text-sm hover:underline mt-2"
          >
            Get DiscordChatExporter
            <ExternalLink className="h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      {/* File Upload */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer',
              isProcessing ? 'opacity-50' : 'hover:border-primary'
            )}
            onClick={() => inputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault()
              handleFileSelect(e.dataTransfer.files)
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".json"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleFileSelect(e.target.files)
                }
              }}
              className="hidden"
              disabled={isProcessing}
            />
            {isProcessing ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <p className="text-lg font-medium">Processing Discord export...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <FileJson className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Drop your Discord export files here</p>
                  <p className="text-sm text-muted-foreground">
                    Upload one or more JSON files from DiscordChatExporter
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileJson className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => inputRef.current?.click()}>
                <Plus className="mr-2 h-4 w-4" />
                Add More
              </Button>
              <Button onClick={processFiles} disabled={isProcessing}>
                Process Files
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errors.map((error, index) => (
              <p key={index}>{error.message}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )

  // Render review step
  const renderReviewStep = () => (
    <div className="space-y-6">
      {/* Server Info */}
      {data?.guild && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              {data.guild.iconUrl ? (
                <img
                  src={data.guild.iconUrl}
                  alt={data.guild.name}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 bg-[#5865F2] rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {data.guild.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{data.guild.name}</h3>
                {data.guild.exportDate && (
                  <p className="text-sm text-muted-foreground">
                    Exported: {new Date(data.guild.exportDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{preview?.stats.totalUsers || 0}</p>
                <p className="text-sm text-muted-foreground">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <Hash className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{preview?.stats.totalChannels || 0}</p>
                <p className="text-sm text-muted-foreground">Channels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{preview?.stats.totalMessages || 0}</p>
                <p className="text-sm text-muted-foreground">Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Channels to Import</CardTitle>
          <CardDescription>
            {selectedChannels.size} of {data?.channels.length || 0} channels selected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <div className="space-y-2">
              {data?.channels.map((channel) => (
                <div
                  key={channel.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedChannels.has(channel.id)
                      ? 'bg-primary/5 border-primary'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => toggleChannel(channel.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-5 h-5 rounded border flex items-center justify-center',
                        selectedChannels.has(channel.id)
                          ? 'bg-primary border-primary'
                          : 'border-input'
                      )}
                    >
                      {selectedChannels.has(channel.id) && (
                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">#{channel.name}</p>
                      {channel.topic && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {channel.topic}
                        </p>
                      )}
                    </div>
                  </div>
                  {channel.categoryName && (
                    <Badge variant="outline">{channel.categoryName}</Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Import Options */}
      <Card>
        <CardHeader>
          <CardTitle>Import Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Import Users</Label>
              <p className="text-xs text-muted-foreground">
                Create user accounts for Discord users
              </p>
            </div>
            <Switch
              checked={config.options.importUsers}
              onCheckedChange={(checked) => handleOptionChange('importUsers', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Skip Bot Users</Label>
              <p className="text-xs text-muted-foreground">
                Exclude Discord bots from import
              </p>
            </div>
            <Switch
              checked={config.options.skipBots}
              onCheckedChange={(checked) => handleOptionChange('skipBots', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Import Attachments</Label>
              <p className="text-xs text-muted-foreground">
                Include file attachments in messages
              </p>
            </div>
            <Switch
              checked={config.options.importAttachments}
              onCheckedChange={(checked) => handleOptionChange('importAttachments', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Import Reactions</Label>
              <p className="text-xs text-muted-foreground">
                Include emoji reactions on messages
              </p>
            </div>
            <Switch
              checked={config.options.importReactions}
              onCheckedChange={(checked) => handleOptionChange('importReactions', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {warnings.map((warning, index) => (
                <li key={index}>{warning.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('upload')}>
          Back
        </Button>
        <Button
          onClick={startImport}
          disabled={selectedChannels.size === 0}
        >
          Start Import
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  // Render importing step
  const renderImportingStep = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
            <div>
              <h3 className="text-xl font-semibold">Importing Discord data...</h3>
              <p className="text-muted-foreground">
                This may take a few minutes for large servers
              </p>
            </div>
            <Progress value={importProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">{importProgress}% complete</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render complete step
  const renderCompleteStep = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Import Complete!</h3>
              <p className="text-muted-foreground">
                Your Discord data has been imported successfully
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <p className="text-2xl font-bold">{preview?.stats.totalUsers || 0}</p>
                <p className="text-sm text-muted-foreground">Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{selectedChannels.size}</p>
                <p className="text-sm text-muted-foreground">Channels</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{preview?.stats.totalMessages || 0}</p>
                <p className="text-sm text-muted-foreground">Messages</p>
              </div>
            </div>
            <Button onClick={() => onImportComplete?.({ success: true, stats: {} })}>
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 'upload':
        return renderUploadStep()
      case 'review':
        return renderReviewStep()
      case 'importing':
        return renderImportingStep()
      case 'complete':
        return renderCompleteStep()
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[#5865F2] rounded-lg">
          <svg
            className="h-8 w-8 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Import from Discord</h2>
          <p className="text-muted-foreground">
            Import your Discord server data including users, channels, and messages
          </p>
        </div>
      </div>

      {renderStep()}

      {step !== 'complete' && step !== 'importing' && (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default DiscordImport
