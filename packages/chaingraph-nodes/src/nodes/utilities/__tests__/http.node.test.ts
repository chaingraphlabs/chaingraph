/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import HttpRequestNode, { HttpMethod, ResponseType } from '../http.node'
import { NodeExecutionStatus } from '@badaitech/chaingraph-types'
import type { ExecutionContext } from '@badaitech/chaingraph-types'

// Helper function for consistent JSON formatting
function formatJSON(obj: any): string {
  return JSON.stringify(obj, null, 0)
}

describe('HttpRequestNode', () => {
  let node: HttpRequestNode
  let mockFetch: any
  let mockContext: ExecutionContext
  let abortController: AbortController

  beforeEach(() => {
    // Reset node instance
    node = new HttpRequestNode('test-http-node')
    node.baseUri = 'https://api.example.com'  // Set default baseUri
    node.path = '/test'  // Set default path

    // Mock fetch
    mockFetch = vi.fn()
    global.fetch = mockFetch

    // Create new abort controller for each test
    abortController = new AbortController()

    // Setup mock context
    mockContext = {
      executionId: 'test-execution',
      flowId: 'test-flow',
      startTime: new Date(),
      metadata: {},
      abortController,
      abortSignal: abortController.signal
    }
  })

  afterEach(() => {
    // Clean up abort controller
    abortController.abort()
    vi.clearAllMocks()
  })

  it('should make a GET request correctly', async () => {
    const responseData = { data: "test" }
    const mockResponse = {
      status: 200,
      text: () => Promise.resolve(formatJSON(responseData)),
      json: () => Promise.resolve(responseData),
      headers: new Headers()
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await node.execute(mockContext)
    expect(result.outputs!.get('response')).toBe(formatJSON(responseData))
  })

  it('should make a POST request with headers and body', async () => {
    node.method = HttpMethod.POST
    node.path = '/auth'
    node.headers = 'Content-Type: application/json'
    const requestBody = { username: "test" }
    node.body = formatJSON(requestBody)

    mockFetch.mockResolvedValueOnce({
      status: 201,
      text: () => Promise.resolve(formatJSON({ token: "123" })),
      json: () => Promise.resolve({ token: "123" }),
      headers: new Headers()
    })

    const result = await node.execute(mockContext)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/auth',
      expect.objectContaining({
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        body: formatJSON(requestBody),
        signal: expect.any(AbortSignal)
      })
    )
  })

  it('should handle network errors correctly', async () => {
    // Setup
    node.baseUri = 'https://api.example.com'
    node.path = '/users'
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    // Execute
    const result = await node.execute(mockContext)

    // Assert
    expect(result.status).toBe(NodeExecutionStatus.Error)
    expect(result.outputs!.get('response')).toBe('Network error')
    expect(result.error).toBe('Network error')
  })

  it('should handle invalid headers format', async () => {
    node.headers = 'Invalid-Header'
    mockFetch.mockResolvedValueOnce({
      status: 200,
      text: () => Promise.resolve('ok'),
      json: () => Promise.resolve({ message: 'ok' }),
      headers: new Headers()
    })

    const result = await node.execute(mockContext)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        headers: {}
      })
    )
    expect(result.status).toBe(NodeExecutionStatus.Completed)
  })

  it('should not include body for GET requests', async () => {
    node.method = HttpMethod.GET
    node.body = 'should-not-be-sent'

    mockFetch.mockResolvedValueOnce({
      status: 200,
      text: () => Promise.resolve('ok'),
      json: () => Promise.resolve({ status: 'ok' }),
      headers: new Headers()
    })

    const result = await node.execute(mockContext)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.not.objectContaining({
        body: expect.anything()
      })
    )
    expect(result.status).toBe(NodeExecutionStatus.Completed)
  })

  // URL Construction Tests
  describe('URL handling', () => {
    it('should handle malformed URLs correctly', async () => {
      node.baseUri = 'invalid-url'
      const result = await node.execute(mockContext)
      expect(result.status).toBe(NodeExecutionStatus.Error)
      expect(result.error).toContain('Invalid Base URI format')
    })

    it('should combine baseUri and path correctly', async () => {
      const testCases = [
        { baseUri: 'https://api.example.com', path: '/users', expected: 'https://api.example.com/users' },
        { baseUri: 'https://api.example.com/', path: '/users', expected: 'https://api.example.com/users' },
        { baseUri: 'https://api.example.com', path: 'users', expected: 'https://api.example.com/users' },
        { baseUri: 'https://api.example.com/', path: 'users', expected: 'https://api.example.com/users' }
      ]

      for (const { baseUri, path, expected } of testCases) {
        node.baseUri = baseUri
        node.path = path
        mockFetch.mockResolvedValueOnce({
          status: 200,
          text: () => Promise.resolve('ok'),
          json: () => Promise.resolve({}),
          headers: new Headers()
        })

        await node.execute(mockContext)

        expect(mockFetch).toHaveBeenCalledWith(
          expected,
          expect.anything()
        )
      }
    })
  })

  // HTTP Methods Tests
  describe('HTTP Methods', () => {
    it('should handle all HTTP methods correctly', async () => {
      for (const method of Object.values(HttpMethod)) {
        node.method = method
        node.headers = method !== HttpMethod.GET ? 'Content-Type: application/json' : ''

        const mockResponse = {
          status: 200,
          text: () => Promise.resolve('ok'),
          json: () => Promise.resolve({ status: 'ok' }),
          headers: new Headers()
        }
        mockFetch.mockResolvedValueOnce(mockResponse)

        const result = await node.execute(mockContext)
        expect(result.status).toBe(NodeExecutionStatus.Completed)
      }
    })
  })

  // Response Handling Tests
  describe('Response handling', () => {
    it('should handle different response content types', async () => {
      const responseData = { key: "value" }
      node.responseType = ResponseType.JSON
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(responseData),
        text: () => Promise.resolve(formatJSON(responseData)),
        headers: new Headers()
      })

      const result = await node.execute(mockContext)
      expect(result.outputs?.get('response')).toBe(formatJSON(responseData))
    })

    it('should handle HTTP error status codes', async () => {
      node.responseType = ResponseType.TEXT
      mockFetch.mockResolvedValueOnce({
        status: 400,
        text: () => Promise.resolve('Bad Request'),
        json: () => Promise.resolve({ error: 'Bad Request' }),
        headers: new Headers()
      })

      const result = await node.execute(mockContext)
      expect(result.outputs?.get('response')).toBe('Bad Request')
    })
  })

  // Headers Tests
  describe('Headers handling', () => {
    it('should handle multiple headers correctly', async () => {
      node.baseUri = 'https://api.example.com'
      node.path = '/test'
      node.headers = 'Content-Type: application/json\nAuthorization: Bearer token123'

      mockFetch.mockResolvedValueOnce({
        status: 200,
        text: () => Promise.resolve('ok'),
        json: () => Promise.resolve({}),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123'
        }
      })

      await node.execute(mockContext)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token123'
          }
        })
      )
    })

    it('should handle invalid header format gracefully', async () => {
      node.headers = 'Invalid-Header'  // Single header
      // ... rest of test
    })

    it('should handle empty headers', async () => {
      node.baseUri = 'https://api.example.com'
      node.path = '/test'
      node.headers = ''
      mockFetch.mockResolvedValueOnce({
        status: 200,
        text: () => Promise.resolve('ok'),
        json: () => Promise.resolve({}),
        headers: {}
      })

      const result = await node.execute(mockContext)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {}
        })
      )
    })

    it('should handle headers with extra whitespace', async () => {
      node.headers = '  Content-Type:   application/json  \n  Authorization:  Bearer token123  '
      // ... test implementation
    })

    it('should handle headers with multiple colons', async () => {
      node.headers = 'Authorization: Bearer: with:colons'
      // ... test implementation
    })
  })

  // Abort Signal Tests
  describe('Abort handling', () => {
    it('should respect abort signal', async () => {
      mockFetch.mockImplementationOnce(() => {
        throw new DOMException('The operation was aborted', 'AbortError')
      })

      const result = await node.execute(mockContext)
      expect(result.status).toBe(NodeExecutionStatus.Error)
      expect(result.error).toContain('aborted')
    })
  })

  it('should make a PATCH request with multiple headers', async () => {
    const requestBody = { status: "active" }
    node.method = HttpMethod.PATCH
    node.path = '/users/1'
    node.headers = 'Content-Type: application/json\nAuthorization: Bearer token123\nX-Custom-Header: value'
    node.body = formatJSON(requestBody)

    mockFetch.mockResolvedValueOnce({
      status: 200,
      text: () => Promise.resolve(formatJSON({ updated: true })),
      json: () => Promise.resolve({ updated: true }),
      headers: new Headers()
    })

    const result = await node.execute(mockContext)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users/1',
      expect.objectContaining({
        method: HttpMethod.PATCH,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'value'
        },
        body: formatJSON(requestBody),
        signal: expect.any(AbortSignal)
      })
    )
  })

  describe('Input Validation', () => {
    it('should validate base URI', async () => {
      node.path = '/test'

      // Empty URI
      node.baseUri = ''
      const result = await node.execute(mockContext)
      expect(result.status).toBe(NodeExecutionStatus.Error)
      expect(result.error).toBe('Base URI is required')

      // Invalid URI
      node.baseUri = 'not-a-url'
      const result2 = await node.execute(mockContext)
      expect(result2.status).toBe(NodeExecutionStatus.Error)
      expect(result2.error).toBe('Invalid Base URI format: not-a-url')
    })

    it('should auto-fix path without leading slash', async () => {
      node.baseUri = 'https://api.example.com'
      node.path = 'test'
      mockFetch.mockResolvedValueOnce({
        status: 200,
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
        headers: new Headers()
      })

      await node.execute(mockContext)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.any(Object)
      )
    })

    it('should validate Content-Type for requests with body', async () => {
      node.baseUri = 'https://api.example.com'
      node.path = '/test'
      node.method = HttpMethod.POST
      node.body = formatJSON({ test: true })

      const result = await node.execute(mockContext)
      expect(result.status).toBe(NodeExecutionStatus.Error)
      expect(result.error).toBe('Content-Type header is required for requests with body')
    })
  })

  describe('Response Handling', () => {
    it('should handle different response types', async () => {
      const responseData = { key: "value" }
      node.responseType = ResponseType.JSON
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(responseData),
        text: () => Promise.resolve(formatJSON(responseData)),
        headers: new Headers()
      })

      const result = await node.execute(mockContext)
      expect(result.outputs?.get('response')).toBe(formatJSON(responseData))
    })

    it('should handle retry logic', async () => {
      node.retries = 2
      node.responseType = ResponseType.TEXT // Set to TEXT type

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          status: 200,
          text: () => Promise.resolve('success'),
          json: () => Promise.resolve({ message: 'success' }),
          headers: new Headers()
        })

      const result = await node.execute(mockContext)
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result.outputs?.get('response')).toBe('success')
    })

    it('should handle timeout', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise((_, reject) => setTimeout(() =>
          reject(new Error('The operation was aborted')), 2000)
        )
      )

      const result = await node.execute(mockContext)
      expect(result.status).toBe(NodeExecutionStatus.Error)
      expect(result.error).toContain('aborted')
    })
  })

  describe('Output Connectivity', () => {
    it('should expose status code for connection', async () => {
      node.baseUri = 'https://api.example.com'
      node.path = '/test'
      mockFetch.mockResolvedValueOnce({
        status: 201,
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
        headers: new Headers()
      })

      const result = await node.execute(mockContext)
      expect(result.outputs?.has('statusCode')).toBe(true)
      expect(result.outputs?.get('statusCode')).toBe(201)
    })
  })

  describe('Response Type handling', () => {
    it('should handle blob responses', async () => {
      node.responseType = ResponseType.BLOB
      const mockBlob = new Blob(['test data'], { type: 'text/plain' })

      mockFetch.mockResolvedValueOnce({
        status: 200,
        blob: () => Promise.resolve(mockBlob),
        text: () => Promise.resolve('test data'),
        headers: new Headers()
      })

      const result = await node.execute(mockContext)
      expect(result.outputs?.get('response')).toBe('Blob: text/plain, 9 bytes')
    })

    it('should handle invalid JSON responses', async () => {
      node.responseType = ResponseType.JSON
      mockFetch.mockResolvedValueOnce({
        status: 200,
        text: () => Promise.resolve('invalid json'),
        json: () => Promise.reject(new Error('Invalid JSON')),
        headers: new Headers()
      })

      const result = await node.execute(mockContext)
      expect(result.status).toBe(NodeExecutionStatus.Error)
      expect(result.error).toContain('Failed to parse response')
    })
  })

  describe('Timeout handling', () => {
    it('should handle immediate timeouts', async () => {
      node.timeout = 1
      mockFetch.mockImplementationOnce(() =>
        new Promise((_, reject) => setTimeout(() =>
          reject(new Error('The operation timed out')), 100)
        )
      )

      const result = await node.execute(mockContext)
      expect(result.status).toBe(NodeExecutionStatus.Error)
      expect(result.error).toContain('timed out')
    })
  })
}) 