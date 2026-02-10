/**
 * File Upload Load Test - 100 Concurrent Uploads
 *
 * Tests file upload performance with various file sizes.
 * Monitors upload speed, processing time, and storage performance.
 *
 * Usage:
 *   k6 run tests/load/file-uploads.js
 *
 * Environment Variables:
 *   API_URL - API base URL (default: http://localhost:3000)
 *   VUS - Virtual users (default: 100)
 *   DURATION - Test duration (default: 5m)
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Trend } from 'k6/metrics'
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js'

// Custom metrics
const uploadsStarted = new Counter('uploads_started')
const uploadsCompleted = new Counter('uploads_completed')
const uploadsFailed = new Counter('uploads_failed')
const uploadTime = new Trend('upload_time', true)
const uploadSpeed = new Trend('upload_speed_mbps', true)
const processingTime = new Trend('processing_time', true)

// Configuration
const API_URL = __ENV.API_URL || 'http://localhost:3000'
const VUS = parseInt(__ENV.VUS || '100')
const DURATION = __ENV.DURATION || '5m'

// File sizes for testing (in bytes)
const FILE_SIZES = {
  small: 1024 * 100, // 100 KB
  medium: 1024 * 1024, // 1 MB
  large: 1024 * 1024 * 10, // 10 MB
  xlarge: 1024 * 1024 * 50, // 50 MB
}

export const options = {
  stages: [
    { duration: '1m', target: VUS / 4 }, // Ramp up to 25%
    { duration: '1m', target: VUS / 2 }, // Ramp to 50%
    { duration: '1m', target: VUS }, // Ramp to 100%
    { duration: DURATION, target: VUS }, // Hold
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    upload_time: ['p(95)<5000', 'p(99)<10000'], // 95% under 5s, 99% under 10s
    processing_time: ['p(95)<2000'], // 95% under 2s
    uploads_failed: ['count<10'], // Less than 10 failures
    http_req_failed: ['rate<0.01'], // Less than 1% errors
  },
}

// Generate file content
function generateFileContent(size) {
  // Generate random-ish content
  const chunkSize = 1024
  const chunks = Math.ceil(size / chunkSize)
  let content = ''

  for (let i = 0; i < chunks; i++) {
    const chunk = 'x'.repeat(Math.min(chunkSize, size - i * chunkSize))
    content += chunk
  }

  return content
}

// Get random file size
function getRandomFileSize() {
  const sizes = Object.keys(FILE_SIZES)
  const sizeKey = sizes[Math.floor(Math.random() * sizes.length)]
  return FILE_SIZES[sizeKey]
}

// Get file type for size
function getFileType(size) {
  const types = [
    { ext: 'txt', mime: 'text/plain' },
    { ext: 'json', mime: 'application/json' },
    { ext: 'jpg', mime: 'image/jpeg' },
    { ext: 'png', mime: 'image/png' },
    { ext: 'pdf', mime: 'application/pdf' },
  ]
  return types[Math.floor(Math.random() * types.length)]
}

export function setup() {
  // Authenticate
  const authRes = http.post(
    `${API_URL}/api/auth/signin`,
    JSON.stringify({
      email: 'loadtest@example.com',
      password: 'password123',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )

  let authToken = ''
  if (authRes.status === 200) {
    authToken = JSON.parse(authRes.body).token
  }

  // Create test channel
  let channelId = ''
  const channelRes = http.post(
    `${API_URL}/api/channels`,
    JSON.stringify({
      name: 'file-upload-test-channel',
      type: 'public',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }
  )

  if (channelRes.status === 201) {
    channelId = JSON.parse(channelRes.body).id
  }

  return { authToken, channelId }
}

export default function (data) {
  const fileSize = getRandomFileSize()
  const fileType = getFileType(fileSize)
  const fileName = `load-test-${Date.now()}.${fileType.ext}`
  const fileContent = generateFileContent(fileSize)

  // Create form data
  const fd = new FormData()
  fd.append('file', http.file(fileContent, fileName, fileType.mime))
  fd.append('channel_id', data.channelId)
  fd.append('description', `Load test file ${fileName}`)

  const uploadStart = Date.now()
  uploadsStarted.add(1)

  // Upload file
  const uploadRes = http.post(`${API_URL}/api/files/upload`, fd.body(), {
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + fd.boundary,
      Authorization: `Bearer ${data.authToken}`,
    },
    tags: { name: 'file_upload' },
    timeout: '60s',
  })

  const uploadEnd = Date.now()
  const uploadDuration = uploadEnd - uploadStart
  uploadTime.add(uploadDuration)

  // Calculate upload speed (Mbps)
  const sizeMB = fileSize / (1024 * 1024)
  const durationSeconds = uploadDuration / 1000
  const speedMbps = (sizeMB * 8) / durationSeconds
  uploadSpeed.add(speedMbps)

  const uploadSuccess = check(uploadRes, {
    'Upload status 200/201': (r) => r.status === 200 || r.status === 201,
    'Upload has file ID': (r) => {
      try {
        return JSON.parse(r.body).id !== undefined
      } catch {
        return false
      }
    },
    'Upload time < 30s': () => uploadDuration < 30000,
  })

  if (uploadSuccess) {
    uploadsCompleted.add(1)

    // Get file ID for processing check
    const fileId = JSON.parse(uploadRes.body).id

    // Check file processing status
    const processStart = Date.now()
    const statusRes = http.get(`${API_URL}/api/files/${fileId}`, {
      headers: {
        Authorization: `Bearer ${data.authToken}`,
      },
      tags: { name: 'file_status' },
    })

    const processEnd = Date.now()
    processingTime.add(processEnd - processStart)

    check(statusRes, {
      'Status check successful': (r) => r.status === 200,
      'File has status': (r) => {
        try {
          return JSON.parse(r.body).status !== undefined
        } catch {
          return false
        }
      },
    })

    // Optional: Download file to verify (sample 10%)
    if (Math.random() < 0.1) {
      const downloadRes = http.get(`${API_URL}/api/files/${fileId}/download`, {
        headers: {
          Authorization: `Bearer ${data.authToken}`,
        },
        tags: { name: 'file_download' },
      })

      check(downloadRes, {
        'Download successful': (r) => r.status === 200,
        'Downloaded size matches': (r) => r.body.length === fileSize,
      })
    }
  } else {
    uploadsFailed.add(1)
    console.error(`Upload failed: ${uploadRes.status} - ${uploadRes.body}`)
  }

  // Think time
  sleep(Math.random() * 2 + 1)
}

export function handleSummary(data) {
  const summary = generateSummary(data)

  return {
    'test-results/file-uploads-summary.json': JSON.stringify(data, null, 2),
    'test-results/file-uploads-report.txt': summary,
    stdout: summary,
  }
}

function generateSummary(data) {
  const metrics = data.metrics

  let summary = '\n' + '='.repeat(80) + '\n'
  summary += 'File Upload Load Test - 100 Concurrent Uploads\n'
  summary += '='.repeat(80) + '\n\n'

  // Upload metrics
  const uploadsStartedTotal = metrics.uploads_started?.values?.count || 0
  const uploadsCompletedTotal = metrics.uploads_completed?.values?.count || 0
  const uploadsFailedTotal = metrics.uploads_failed?.values?.count || 0
  const successRate =
    uploadsStartedTotal > 0 ? (uploadsCompletedTotal / uploadsStartedTotal) * 100 : 0

  summary += 'Upload Metrics:\n'
  summary += `  Uploads Started: ${uploadsStartedTotal}\n`
  summary += `  Uploads Completed: ${uploadsCompletedTotal}\n`
  summary += `  Uploads Failed: ${uploadsFailedTotal}\n`
  summary += `  Success Rate: ${successRate.toFixed(2)}%\n\n`

  // Performance metrics
  summary += 'Performance Metrics:\n'
  summary += `  Average Upload Time: ${(metrics.upload_time?.values?.avg || 0).toFixed(2)}ms\n`
  summary += `  p50 Upload Time: ${(metrics.upload_time?.values?.['p(50)'] || 0).toFixed(2)}ms\n`
  summary += `  p95 Upload Time: ${(metrics.upload_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n`
  summary += `  p99 Upload Time: ${(metrics.upload_time?.values?.['p(99)'] || 0).toFixed(2)}ms\n`
  summary += `  Max Upload Time: ${(metrics.upload_time?.values?.max || 0).toFixed(2)}ms\n\n`

  summary += 'Upload Speed:\n'
  summary += `  Average: ${(metrics.upload_speed_mbps?.values?.avg || 0).toFixed(2)} Mbps\n`
  summary += `  p95: ${(metrics.upload_speed_mbps?.values?.['p(95)'] || 0).toFixed(2)} Mbps\n\n`

  summary += 'Processing Performance:\n'
  summary += `  Average Processing Time: ${(metrics.processing_time?.values?.avg || 0).toFixed(2)}ms\n`
  summary += `  p95 Processing Time: ${(metrics.processing_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n\n`

  // Test result
  const passed = successRate >= 99 && (metrics.upload_time?.values?.['p(95)'] || 999999) < 5000

  summary += 'Test Result: ' + (passed ? '✅ PASSED' : '❌ FAILED') + '\n'
  summary += '='.repeat(80) + '\n'

  return summary
}
