# File Preview System

Complete file preview system with support for images, videos, audio, PDFs, documents, and code files.

## Components

### 1. FilePreview (Main Component)

Universal file preview modal that automatically selects the appropriate viewer based on file type.

**Features:**
- Automatic viewer selection based on MIME type
- Keyboard navigation (←/→ for prev/next, Esc to close, D to download, I for info)
- Gallery mode with multiple files
- Download and share functionality
- File metadata display
- Navigation arrows between files
- Position indicator (e.g., "3 / 12")

**Usage:**

```tsx
import { FilePreview } from '@/components/media/FilePreview';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaItem | null>(null);

  return (
    <FilePreview
      item={selectedFile!}
      items={allFiles}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onNext={() => {/* navigate to next file */}}
      onPrevious={() => {/* navigate to previous file */}}
      showNavigation={true}
      showInfo={true}
    />
  );
}
```

**Props:**
- `item: MediaItem` - Current file to preview
- `items?: MediaItem[]` - All files for gallery navigation
- `isOpen: boolean` - Modal open state
- `onClose: () => void` - Close handler
- `onNext?: () => void` - Next file handler
- `onPrevious?: () => void` - Previous file handler
- `onDownload?: () => void` - Custom download handler
- `onShare?: () => void` - Share handler
- `showNavigation?: boolean` - Show navigation arrows (default: true)
- `showInfo?: boolean` - Show info tab (default: false)
- `className?: string` - Additional CSS classes

---

### 2. PDFViewer

PDF document viewer using PDF.js from CDN.

**Features:**
- Page navigation (arrows, input field)
- Zoom controls (in/out/reset)
- Keyboard shortcuts (←/→ for pages, +/- for zoom)
- Page count display
- File metadata display
- Download button
- No npm dependencies (uses PDF.js from CDN)

**Usage:**

```tsx
import { PDFViewer } from '@/components/media/PDFViewer';

function PDFPreview() {
  return (
    <PDFViewer
      item={pdfFile}
      initialPage={1}
      initialZoom={1.5}
      showControls={true}
      onDownload={handleDownload}
    />
  );
}
```

**Props:**
- `item: MediaItem` - PDF file to display
- `initialPage?: number` - Starting page (default: 1)
- `initialZoom?: number` - Starting zoom level (default: 1.5)
- `showThumbnails?: boolean` - Show page thumbnails (default: false)
- `showControls?: boolean` - Show control bar (default: true)
- `onDownload?: () => void` - Download handler
- `className?: string` - Additional CSS classes

**PDF.js Configuration:**
- Version: 4.0.379 (from CDN)
- Worker loaded automatically
- No npm installation required
- Lazy-loaded on demand

---

### 3. DocumentPreview

Text and code file preview with syntax highlighting.

**Features:**
- Text file preview with line numbers
- Code syntax detection (20+ languages)
- CSV table rendering
- Copy to clipboard
- Line number toggle
- Scrollable content
- File metadata display
- Download and open external buttons

**Supported File Types:**
- **Text:** .txt, .md, .log
- **Code:** .js, .ts, .jsx, .tsx, .html, .css, .json, .py, .java, .c, .cpp, .go, .rs, .rb, .php
- **Data:** .csv (rendered as table)
- **Config:** .yaml, .yml, .xml, .sh

**Usage:**

```tsx
import { DocumentPreview } from '@/components/media/DocumentPreview';

function CodePreview() {
  return (
    <DocumentPreview
      item={codeFile}
      maxLines={500}
      showLineNumbers={true}
      onDownload={handleDownload}
      onOpenExternal={handleOpen}
    />
  );
}
```

**Props:**
- `item: MediaItem` - Document to display
- `maxLines?: number` - Max lines to display (default: 500)
- `showLineNumbers?: boolean` - Show line numbers (default: true)
- `onDownload?: () => void` - Download handler
- `onOpenExternal?: () => void` - Open in new tab handler
- `className?: string` - Additional CSS classes

**CSV Rendering:**
- Automatically renders CSV as table
- Header row styling
- Scrollable rows
- Cell padding and borders

---

### 4. ImageViewer

Already exists - image viewer with zoom, pan, and rotation.

**Features:**
- Zoom in/out (mouse wheel, buttons)
- Pan and drag when zoomed
- Rotate left/right
- Double-click to zoom
- Reset to fit
- Download button

---

### 5. VideoPlayer

Already exists - video player with full controls.

**Features:**
- Play/pause
- Seek bar
- Volume control
- Playback speed (0.25x - 2x)
- Skip forward/backward
- Fullscreen toggle
- Download button

---

### 6. AudioPlayer

Already exists - audio player with waveform.

**Features:**
- Play/pause
- Seek bar
- Volume control
- Playback speed
- Skip forward/backward
- Compact and full modes
- Download button

---

## Utility Library

### File Preview Utilities (`/lib/media/file-preview.ts`)

**Type Detection:**
```typescript
import {
  isImage,
  isVideo,
  isAudio,
  isPDF,
  isDocument,
  isCode,
  isTextBased,
  getFileCategory,
  getFileTypeInfo,
} from '@/lib/media/file-preview';

// Check file type
if (isImage(file.mimeType)) {
  // Show image viewer
}

// Get file info
const info = getFileTypeInfo(file.mimeType);
console.log(info.category, info.icon, info.color, info.previewable);
```

**File Categories:**
- `image` - JPG, PNG, GIF, WebP, SVG, BMP
- `video` - MP4, WebM, OGG, QuickTime, MPEG
- `audio` - MP3, WAV, OGG, FLAC, AAC, M4A
- `document` - PDF, Word, RTF
- `spreadsheet` - Excel, CSV
- `presentation` - PowerPoint
- `archive` - ZIP, RAR, 7Z, TAR, GZIP
- `code` - JS, TS, HTML, CSS, JSON, Python, etc.
- `text` - TXT, MD, LOG
- `font` - TTF, OTF, WOFF
- `executable` - EXE, DMG, APP
- `unknown` - Other files

**Preview URL Generation:**
```typescript
import {
  generatePreviewUrl,
  generateDataUrl,
  revokePreviewUrl,
} from '@/lib/media/file-preview';

// Create blob URL
const url = generatePreviewUrl(file);

// Create data URL
const dataUrl = await generateDataUrl(file);

// Clean up
revokePreviewUrl(url);
```

**Text/Code Preview:**
```typescript
import {
  generateTextPreview,
  generateCodePreview,
} from '@/lib/media/file-preview';

// Load text content
const text = await generateTextPreview(file, 1000);

// Load code with language detection
const { content, language } = await generateCodePreview(file, 20);
console.log(language); // 'javascript', 'python', etc.
```

**File Information:**
```typescript
import {
  getFileExtension,
  getFileBaseName,
  formatFileSize,
  getFriendlyTypeName,
} from '@/lib/media/file-preview';

getFileExtension('document.pdf'); // 'pdf'
getFileBaseName('document.pdf'); // 'document'
formatFileSize(1048576); // '1 MB'
getFriendlyTypeName('application/pdf'); // 'PDF Document'
```

**Download Helpers:**
```typescript
import {
  downloadFile,
  openInNewTab,
} from '@/lib/media/file-preview';

// Trigger download
downloadFile(file, 'custom-name.pdf');
downloadFile(url, 'custom-name.pdf');
downloadFile(blob, 'custom-name.pdf');

// Open in new tab
openInNewTab(url);
openInNewTab(file);
```

---

## Keyboard Shortcuts

### FilePreview Modal
- **Esc** - Close preview
- **←** - Previous file
- **→** - Next file
- **D** - Download file
- **I** - Toggle info panel

### PDFViewer
- **←** - Previous page
- **→** - Next page
- **+** or **=** - Zoom in
- **-** - Zoom out
- **0** - Reset zoom

### ImageViewer
- **Mouse Wheel** - Zoom in/out
- **Double Click** - Toggle zoom
- **Drag** - Pan when zoomed

---

## Architecture

### File Type Detection Flow

```
1. User opens file
   ↓
2. FilePreview checks MIME type
   ↓
3. Route to appropriate viewer:
   - image/* → ImageViewer
   - video/* → VideoPlayer
   - audio/* → AudioPlayer
   - application/pdf → PDFViewer
   - text/* or code → DocumentPreview
   - other → Download prompt
```

### PDF.js Integration

```
1. Component mounts
   ↓
2. Load PDF.js from CDN
   ↓
3. Configure worker
   ↓
4. Load PDF document
   ↓
5. Render page to canvas
   ↓
6. Handle navigation/zoom
```

**No npm dependencies required!** PDF.js is loaded from CDN:
- Library: `cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js`
- Worker: `cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`

---

## Example Implementation

See `/src/components/media/FilePreviewExample.tsx` for a complete working example with:
- File list with preview buttons
- Gallery navigation
- Multiple file types
- Download functionality
- File metadata display

---

## Styling

All components use:
- **Tailwind CSS** for styling
- **Radix UI** for accessible primitives
- **Lucide React** for icons
- **CVA** (class-variance-authority) for variants

Custom theming is inherited from the app's theme system.

---

## Browser Support

- **Modern browsers** (Chrome, Firefox, Safari, Edge)
- **PDF.js** works in all modern browsers
- **Video/Audio** support depends on browser codec support
- **Fallback** to download prompt for unsupported types

---

## Performance

- **Lazy loading:** PDF.js loaded only when needed
- **Canvas rendering:** Efficient PDF page rendering
- **Code preview:** Limited to configurable max lines
- **Image optimization:** Uses existing ImageViewer optimizations
- **Blob URL cleanup:** Automatic URL revocation

---

## Limitations

1. **PDF.js CDN dependency:** Requires internet connection (can be self-hosted)
2. **No Word/Excel preview:** Only download available (requires backend conversion)
3. **Code syntax:** Basic syntax detection (no advanced highlighting)
4. **Large files:** Text preview limited to avoid performance issues
5. **HEIC/HEIF images:** Not supported in most browsers

---

## Future Enhancements

- [ ] Thumbnail generation for videos
- [ ] PDF thumbnail sidebar
- [ ] Advanced code syntax highlighting (CodeMirror/Monaco)
- [ ] Word/Excel preview (via backend conversion)
- [ ] 3D model preview (.obj, .gltf)
- [ ] Archive preview (ZIP contents)
- [ ] Audio waveform visualization
- [ ] Video timeline preview
- [ ] Annotation support for PDFs/images
- [ ] Comparison mode (side-by-side)

---

## Files Structure

```
src/
├── components/media/
│   ├── FilePreview.tsx           # Main universal preview modal
│   ├── PDFViewer.tsx             # PDF viewer with PDF.js
│   ├── DocumentPreview.tsx       # Text/code preview
│   ├── ImageViewer.tsx           # Image viewer (existing)
│   ├── VideoPlayer.tsx           # Video player (existing)
│   ├── AudioPlayer.tsx           # Audio player (existing)
│   ├── MediaInfo.tsx             # File metadata display (existing)
│   └── FilePreviewExample.tsx    # Example implementation
├── lib/media/
│   └── file-preview.ts           # Utility functions
└── docs/
    └── File-Preview-System.md    # This file
```

---

## Integration Example

```tsx
import { useState } from 'react';
import { FilePreview } from '@/components/media/FilePreview';
import { MediaItem } from '@/lib/media/media-types';

function ChatMessage({ message }) {
  const [previewFile, setPreviewFile] = useState<MediaItem | null>(null);

  return (
    <>
      <div className="message">
        {message.attachments.map((file) => (
          <button
            key={file.id}
            onClick={() => setPreviewFile(file)}
            className="file-attachment"
          >
            <FileIcon type={file.mimeType} />
            <span>{file.fileName}</span>
          </button>
        ))}
      </div>

      {previewFile && (
        <FilePreview
          item={previewFile}
          items={message.attachments}
          isOpen={true}
          onClose={() => setPreviewFile(null)}
          showNavigation={true}
          showInfo={true}
        />
      )}
    </>
  );
}
```

---

## Testing

To test the file preview system:

1. Import `FilePreviewExample` component
2. Add example files with different types
3. Test keyboard navigation
4. Verify download functionality
5. Check responsive behavior
6. Test with large files

```tsx
import { FilePreviewExample } from '@/components/media/FilePreviewExample';

export default function TestPage() {
  return <FilePreviewExample />;
}
```

---

## Production Checklist

- [x] File type detection
- [x] Image preview with zoom/pan
- [x] Video preview with controls
- [x] Audio preview
- [x] PDF preview with navigation
- [x] Text/code preview with syntax
- [x] CSV table rendering
- [x] Download functionality
- [x] Keyboard shortcuts
- [x] Gallery navigation
- [x] File metadata display
- [x] Responsive design
- [x] Error handling
- [x] Loading states
- [x] Accessibility
- [x] TypeScript types
- [x] Documentation

---

## Support

For issues or questions about the file preview system, see:
- Component source code with inline documentation
- Example implementation in `FilePreviewExample.tsx`
- Utility functions in `file-preview.ts`
- This documentation file

---

**Status:** ✅ Complete and Production-Ready

**Version:** 1.0.0

**Last Updated:** February 1, 2026
