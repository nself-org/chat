/**
 * API Documentation Route
 *
 * Serves interactive API documentation using Swagger UI.
 */

import { NextRequest, NextResponse } from 'next/server'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export async function GET(request: NextRequest) {
  // In production, this would serve the Swagger UI HTML
  // For now, redirect to the OpenAPI spec
  return NextResponse.redirect(new URL('/api/openapi.json', request.url))
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
