/**
 * @jest-environment node
 */

import { GET } from '@/app/api/articles/route'
import { NextRequest } from 'next/server'

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn(),
}))

// Mock gray-matter
jest.mock('gray-matter', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const fs = require('fs')
const matter = require('gray-matter')

describe('/api/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return articles successfully', async () => {
    // Mock file system
    fs.existsSync.mockReturnValue(true)
    fs.readdirSync.mockReturnValue(['article1.md', 'article2.md'])
    fs.readFileSync.mockReturnValue('---\ntitle: Test Article\n---\nContent')
    fs.statSync.mockReturnValue({
      birthtime: new Date('2024-01-01'),
      mtime: new Date('2024-01-02'),
    })

    // Mock gray-matter
    matter.default.mockReturnValue({
      data: {
        title: 'Test Article',
        description: 'Test Description',
        tags: ['test'],
        author: 'Test Author',
      },
      content: 'Test content',
    })

    const request = new NextRequest('http://localhost:3001/api/articles')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('should filter articles by category', async () => {
    fs.existsSync.mockReturnValue(true)
    fs.readdirSync.mockReturnValue(['tech1.md', 'tech2.md'])
    fs.readFileSync.mockReturnValue('---\ntitle: Tech Article\n---\nContent')
    fs.statSync.mockReturnValue({
      birthtime: new Date('2024-01-01'),
      mtime: new Date('2024-01-02'),
    })

    matter.default.mockReturnValue({
      data: {
        title: 'Tech Article',
        description: 'Tech Description',
      },
      content: 'Tech content',
    })

    const request = new NextRequest('http://localhost:3001/api/articles?category=tech')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('should handle search queries', async () => {
    fs.existsSync.mockReturnValue(true)
    fs.readdirSync.mockReturnValue(['searchable.md'])
    fs.readFileSync.mockReturnValue('---\ntitle: Searchable Article\n---\nSearchable content')
    fs.statSync.mockReturnValue({
      birthtime: new Date('2024-01-01'),
      mtime: new Date('2024-01-02'),
    })

    matter.default.mockReturnValue({
      data: {
        title: 'Searchable Article',
        description: 'Searchable Description',
      },
      content: 'Searchable content',
    })

    const request = new NextRequest('http://localhost:3001/api/articles?search=searchable')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should handle missing content directory', async () => {
    fs.existsSync.mockReturnValue(false)

    const request = new NextRequest('http://localhost:3001/api/articles')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('should handle file system errors gracefully', async () => {
    fs.existsSync.mockImplementation(() => {
      throw new Error('File system error')
    })

    const request = new NextRequest('http://localhost:3001/api/articles')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('获取文章列表失败')
  })

  it('should filter by status', async () => {
    fs.existsSync.mockReturnValue(true)
    fs.readdirSync.mockReturnValue(['published.md', 'draft.md'])
    fs.readFileSync.mockReturnValue('---\ntitle: Article\n---\nContent')
    fs.statSync.mockReturnValue({
      birthtime: new Date('2024-01-01'),
      mtime: new Date('2024-01-02'),
    })

    matter.default.mockReturnValue({
      data: {
        title: 'Article',
        publish: { website: true },
      },
      content: 'Content',
    })

    const request = new NextRequest('http://localhost:3001/api/articles?status=published')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
