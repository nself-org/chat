/**
 * Bookmarks API Route
 *
 * REST API endpoints for bookmark operations including export functionality.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// ============================================================================
// GET /api/bookmarks
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const export_format = searchParams.get('export')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // If export parameter is provided, handle export
    if (export_format) {
      return handleExport(userId, export_format, searchParams)
    }

    // Otherwise, return bookmarks list
    // Note: In a real implementation, this would fetch from the database
    // For now, we'll return a placeholder response
    return NextResponse.json({
      bookmarks: [],
      total: 0,
      message: 'Use GraphQL queries for fetching bookmarks',
    })
  } catch (error) {
    logger.error('Failed to get bookmarks', error as Error)
    return NextResponse.json(
      { error: 'Failed to get bookmarks', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/bookmarks
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'add':
        return handleAddBookmark(data)
      case 'remove':
        return handleRemoveBookmark(data)
      case 'update':
        return handleUpdateBookmark(data)
      case 'export':
        return handleExportBookmarks(data)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Failed to process bookmark action', error as Error)
    return NextResponse.json(
      { error: 'Failed to process bookmark action', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function handleAddBookmark(data: {
  userId: string
  messageId: string
  note?: string
  tags?: string[]
  collectionIds?: string[]
}) {
  try {
    const { userId, messageId, note, tags, collectionIds } = data

    if (!userId || !messageId) {
      return NextResponse.json({ error: 'userId and messageId are required' }, { status: 400 })
    }

    logger.info('Adding bookmark', { userId, messageId })

    // In a real implementation, this would use GraphQL or direct DB access
    // For now, return a success response
    return NextResponse.json({
      success: true,
      message: 'Bookmark added successfully',
      bookmark: {
        id: `bookmark-${Date.now()}`,
        userId,
        messageId,
        note,
        tags: tags || [],
        collectionIds: collectionIds || [],
        bookmarkedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Failed to add bookmark', error as Error)
    throw error
  }
}

async function handleRemoveBookmark(data: { bookmarkId: string }) {
  try {
    const { bookmarkId } = data

    if (!bookmarkId) {
      return NextResponse.json({ error: 'bookmarkId is required' }, { status: 400 })
    }

    logger.info('Removing bookmark', { bookmarkId })

    return NextResponse.json({
      success: true,
      message: 'Bookmark removed successfully',
    })
  } catch (error) {
    logger.error('Failed to remove bookmark', error as Error)
    throw error
  }
}

async function handleUpdateBookmark(data: {
  bookmarkId: string
  note?: string
  tags?: string[]
  collectionIds?: string[]
}) {
  try {
    const { bookmarkId, note, tags, collectionIds } = data

    if (!bookmarkId) {
      return NextResponse.json({ error: 'bookmarkId is required' }, { status: 400 })
    }

    logger.info('Updating bookmark', { bookmarkId })

    return NextResponse.json({
      success: true,
      message: 'Bookmark updated successfully',
      bookmark: {
        id: bookmarkId,
        note,
        tags,
        collectionIds,
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Failed to update bookmark', error as Error)
    throw error
  }
}

async function handleExportBookmarks(data: {
  userId: string
  format: 'json' | 'csv' | 'markdown' | 'html'
  options?: {
    includeContent?: boolean
    includeAttachments?: boolean
    includeMetadata?: boolean
    collectionIds?: string[]
    channelIds?: string[]
  }
}) {
  try {
    const { userId, format, options = {} } = data

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    logger.info('Exporting bookmarks', { userId, format })

    // In a real implementation, this would fetch bookmarks from the database
    // and format them according to the requested format
    const exportData = {
      exportedAt: new Date().toISOString(),
      format,
      totalCount: 0,
      bookmarks: [],
    }

    let content: string
    let mimeType: string
    let filename: string

    switch (format) {
      case 'json':
        content = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'
        filename = `bookmarks-${Date.now()}.json`
        break
      case 'csv':
        content = convertToCSV(exportData)
        mimeType = 'text/csv'
        filename = `bookmarks-${Date.now()}.csv`
        break
      case 'markdown':
        content = convertToMarkdown(exportData)
        mimeType = 'text/markdown'
        filename = `bookmarks-${Date.now()}.md`
        break
      case 'html':
        content = convertToHTML(exportData)
        mimeType = 'text/html'
        filename = `bookmarks-${Date.now()}.html`
        break
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error('Failed to export bookmarks', error as Error)
    throw error
  }
}

async function handleExport(userId: string, format: string, searchParams: URLSearchParams) {
  try {
    const includeContent = searchParams.get('includeContent') !== 'false'
    const includeAttachments = searchParams.get('includeAttachments') === 'true'
    const includeMetadata = searchParams.get('includeMetadata') === 'true'

    logger.info('Exporting bookmarks via GET', { userId, format })

    const exportData = {
      exportedAt: new Date().toISOString(),
      format,
      totalCount: 0,
      bookmarks: [],
      options: {
        includeContent,
        includeAttachments,
        includeMetadata,
      },
    }

    let content: string
    let mimeType: string
    let filename: string

    switch (format) {
      case 'json':
        content = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'
        filename = `bookmarks-${Date.now()}.json`
        break
      case 'csv':
        content = convertToCSV(exportData)
        mimeType = 'text/csv'
        filename = `bookmarks-${Date.now()}.csv`
        break
      case 'markdown':
        content = convertToMarkdown(exportData)
        mimeType = 'text/markdown'
        filename = `bookmarks-${Date.now()}.md`
        break
      case 'html':
        content = convertToHTML(exportData)
        mimeType = 'text/html'
        filename = `bookmarks-${Date.now()}.html`
        break
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error('Failed to export bookmarks', error as Error)
    throw error
  }
}

// ============================================================================
// Format Converters
// ============================================================================

function convertToCSV(data: any): string {
  const headers = ['ID', 'Content', 'Bookmarked At', 'Note', 'Tags', 'Channel', 'Author']
  const rows = data.bookmarks.map((b: any) => [
    b.id || '',
    b.content ? `"${b.content.replace(/"/g, '""')}"` : '',
    b.bookmarkedAt || '',
    b.note ? `"${b.note.replace(/"/g, '""')}"` : '',
    b.tags?.join('; ') || '',
    b.channel?.name || '',
    b.author?.displayName || '',
  ])

  return [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n')
}

function convertToMarkdown(data: any): string {
  let md = `# Bookmarks Export\n\n`
  md += `Exported at: ${data.exportedAt}\n`
  md += `Total bookmarks: ${data.totalCount}\n\n`
  md += `---\n\n`

  if (data.bookmarks.length === 0) {
    md += `No bookmarks to export.\n`
  } else {
    data.bookmarks.forEach((b: any, index: number) => {
      md += `## ${index + 1}. ${b.channel?.name || 'Unknown Channel'}\n\n`
      md += `**Author:** ${b.author?.displayName || 'Unknown'}\n`
      md += `**Bookmarked:** ${b.bookmarkedAt}\n\n`
      if (b.content) {
        md += `${b.content}\n\n`
      }
      if (b.note) {
        md += `> Note: ${b.note}\n\n`
      }
      if (b.tags && b.tags.length > 0) {
        md += `Tags: ${b.tags.map((t: string) => `${t}`).join(', ')}\n\n`
      }
      md += `---\n\n`
    })
  }

  return md
}

function convertToHTML(data: any): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bookmarks Export</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
    }
    .header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    .bookmark {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .bookmark-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
    .bookmark-content {
      margin-bottom: 0.5rem;
    }
    .bookmark-note {
      background: #f9fafb;
      padding: 0.5rem;
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
    .tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .tag {
      background: #e5e7eb;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Bookmarks Export</h1>
    <p>Exported at: ${data.exportedAt}</p>
    <p>Total bookmarks: ${data.totalCount}</p>
  </div>
`

  if (data.bookmarks.length === 0) {
    html += `<p>No bookmarks to export.</p>`
  } else {
    data.bookmarks.forEach((b: any) => {
      html += `
  <div class="bookmark">
    <div class="bookmark-header">
      <span><strong>${b.author?.displayName || 'Unknown'}</strong> in #${b.channel?.name || 'unknown'}</span>
      <span>${b.bookmarkedAt}</span>
    </div>
`
      if (b.content) {
        html += `    <div class="bookmark-content">${b.content}</div>\n`
      }
      if (b.note) {
        html += `    <div class="bookmark-note">Note: ${b.note}</div>\n`
      }
      if (b.tags && b.tags.length > 0) {
        html += `    <div class="tags">\n`
        b.tags.forEach((tag: string) => {
          html += `      <span class="tag">${tag}</span>\n`
        })
        html += `    </div>\n`
      }
      html += `  </div>\n`
    })
  }

  html += `
</body>
</html>`

  return html
}
