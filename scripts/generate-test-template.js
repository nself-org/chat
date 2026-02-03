#!/usr/bin/env node
/**
 * Test Template Generator
 *
 * Generates test file templates for services, hooks, and components.
 *
 * Usage:
 *   node scripts/generate-test-template.js service src/services/example/example.service.ts
 *   node scripts/generate-test-template.js hook src/hooks/use-example.ts
 *   node scripts/generate-test-template.js component src/components/example/Example.tsx
 */

const fs = require('fs')
const path = require('path')

// ============================================================================
// Templates
// ============================================================================

const SERVICE_TEMPLATE = (serviceName, serviceClass, importPath) => `/**
 * @jest-environment node
 */
import { ${serviceClass} } from '${importPath}'
import { createUser, createChannel } from '@/test-utils'

describe('${serviceClass}', () => {
  let service: ${serviceClass}

  beforeEach(() => {
    service = new ${serviceClass}()
  })

  describe('constructor', () => {
    it('should initialize successfully', () => {
      expect(service).toBeDefined()
    })
  })

  // TODO: Add test cases for all public methods
  // Example test structure:
  //
  // describe('methodName', () => {
  //   it('should handle success case', async () => {
  //     // Arrange
  //     const input = {}
  //
  //     // Act
  //     const result = await service.methodName(input)
  //
  //     // Assert
  //     expect(result).toBeDefined()
  //   })
  //
  //   it('should handle error case', async () => {
  //     await expect(service.methodName(null)).rejects.toThrow()
  //   })
  // })
})
`

const HOOK_TEMPLATE = (hookName, importPath) => `/**
 * Tests for ${hookName} hook
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { ${hookName} } from '${importPath}'
import { createUser } from '@/test-utils'

describe('${hookName}', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => ${hookName}())

    expect(result.current).toBeDefined()
  })

  it('should handle loading state', async () => {
    const { result } = renderHook(() => ${hookName}())

    expect(result.current.loading).toBeDefined()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('should handle errors', async () => {
    const { result } = renderHook(() => ${hookName}())

    // TODO: Trigger error condition

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })
  })

  // TODO: Add test cases for all hook functionality
  // Example test structure:
  //
  // it('should update state on action', async () => {
  //   const { result } = renderHook(() => ${hookName}())
  //
  //   await act(async () => {
  //     await result.current.someAction()
  //   })
  //
  //   expect(result.current.someState).toBe(expectedValue)
  // })
})
`

const COMPONENT_TEMPLATE = (componentName, importPath) => `/**
 * Tests for ${componentName} component
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ${componentName} } from '${importPath}'
import { renderWithProviders } from '@/test-utils'

describe('${componentName}', () => {
  it('should render successfully', () => {
    render(<${componentName} />)
    expect(screen.getByRole('...')).toBeInTheDocument()
  })

  it('should display correct content', () => {
    render(<${componentName} />)
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const user = userEvent.setup()
    render(<${componentName} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('...')).toBeInTheDocument()
    })
  })

  it('should handle props correctly', () => {
    const props = {
      // Add test props
    }

    render(<${componentName} {...props} />)

    // Add assertions
  })

  // TODO: Add test cases for all component functionality
  // - Rendering variants
  // - Event handlers
  // - State changes
  // - Error boundaries
  // - Accessibility
})
`

const API_ROUTE_TEMPLATE = (routeName, importPath) => `/**
 * Integration tests for ${routeName} API route
 */
import { GET, POST, PUT, DELETE } from '${importPath}'
import { NextRequest } from 'next/server'
import { createUser, createChannel } from '@/test-utils'

describe('${routeName} API Route', () => {
  describe('GET', () => {
    it('should return 200 for valid request', async () => {
      const request = new NextRequest('http://localhost:3000${routeName}')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toBeDefined()
    })

    it('should return 401 for unauthenticated request', async () => {
      const request = new NextRequest('http://localhost:3000${routeName}')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent resource', async () => {
      const request = new NextRequest('http://localhost:3000${routeName}/non-existent')
      const response = await GET(request)

      expect(response.status).toBe(404)
    })
  })

  describe('POST', () => {
    it('should create resource with valid data', async () => {
      const body = {
        // Add test data
      }

      const request = new NextRequest('http://localhost:3000${routeName}', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.id).toBeDefined()
    })

    it('should return 400 for invalid data', async () => {
      const request = new NextRequest('http://localhost:3000${routeName}', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  // TODO: Add tests for PUT, DELETE, PATCH as needed
})
`

// ============================================================================
// Generator Functions
// ============================================================================

function generateServiceTest(filePath) {
  const fileName = path.basename(filePath, '.ts')
  const serviceName = fileName.replace('.service', '')
  const serviceClass =
    serviceName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('') + 'Service'

  const dir = path.dirname(filePath)
  const testDir = path.join(dir, '__tests__')
  const testFile = path.join(testDir, `${fileName}.test.ts`)
  const importPath = `../${fileName}`

  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }

  if (fs.existsSync(testFile)) {
    console.log(`❌ Test file already exists: ${testFile}`)
    return
  }

  const content = SERVICE_TEMPLATE(serviceName, serviceClass, importPath)
  fs.writeFileSync(testFile, content)

  console.log(`✅ Created service test: ${testFile}`)
}

function generateHookTest(filePath) {
  const fileName = path.basename(filePath, '.ts').replace('.tsx', '')
  const hookName = fileName
    .split('-')
    .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('')

  const dir = path.dirname(filePath)
  const testDir = path.join(dir, '__tests__')
  const testFile = path.join(testDir, `${fileName}.test.ts`)
  const importPath = `../${fileName}`

  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }

  if (fs.existsSync(testFile)) {
    console.log(`❌ Test file already exists: ${testFile}`)
    return
  }

  const content = HOOK_TEMPLATE(hookName, importPath)
  fs.writeFileSync(testFile, content)

  console.log(`✅ Created hook test: ${testFile}`)
}

function generateComponentTest(filePath) {
  const fileName = path.basename(filePath, '.tsx')
  const componentName = fileName

  const dir = path.dirname(filePath)
  const testDir = path.join(dir, '__tests__')
  const testFile = path.join(testDir, `${fileName.toLowerCase()}.test.tsx`)
  const importPath = `../${fileName}`

  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }

  if (fs.existsSync(testFile)) {
    console.log(`❌ Test file already exists: ${testFile}`)
    return
  }

  const content = COMPONENT_TEMPLATE(componentName, importPath)
  fs.writeFileSync(testFile, content)

  console.log(`✅ Created component test: ${testFile}`)
}

function generateAPIRouteTest(filePath) {
  const routeName = path.dirname(filePath).replace('src/app/api', '')
  const dir = path.dirname(filePath)
  const testDir = path.join(dir, '__tests__')
  const testFile = path.join(testDir, 'route.test.ts')
  const importPath = '../route'

  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }

  if (fs.existsSync(testFile)) {
    console.log(`❌ Test file already exists: ${testFile}`)
    return
  }

  const content = API_ROUTE_TEMPLATE(routeName, importPath)
  fs.writeFileSync(testFile, content)

  console.log(`✅ Created API route test: ${testFile}`)
}

// ============================================================================
// CLI
// ============================================================================

const [, , type, filePath] = process.argv

if (!type || !filePath) {
  console.log(`
Test Template Generator

Usage:
  node scripts/generate-test-template.js <type> <file-path>

Types:
  service    - Generate service test
  hook       - Generate hook test
  component  - Generate component test
  api-route  - Generate API route test

Examples:
  node scripts/generate-test-template.js service src/services/example/example.service.ts
  node scripts/generate-test-template.js hook src/hooks/use-example.ts
  node scripts/generate-test-template.js component src/components/example/Example.tsx
  node scripts/generate-test-template.js api-route src/app/api/example/route.ts
  `)
  process.exit(1)
}

const absolutePath = path.resolve(process.cwd(), filePath)

if (!fs.existsSync(absolutePath)) {
  console.log(`❌ File not found: ${absolutePath}`)
  process.exit(1)
}

switch (type) {
  case 'service':
    generateServiceTest(absolutePath)
    break
  case 'hook':
    generateHookTest(absolutePath)
    break
  case 'component':
    generateComponentTest(absolutePath)
    break
  case 'api-route':
    generateAPIRouteTest(absolutePath)
    break
  default:
    console.log(`❌ Unknown type: ${type}`)
    console.log('Valid types: service, hook, component, api-route')
    process.exit(1)
}
