import { describe, expect, test } from 'vitest'
import { STATUS_META, PRIORITY_META, statusLabel, fmtFull, fmtDate } from './helpers'

describe('statusLabel', () => {
  test('maps each known status to its label', () => {
    expect(statusLabel('ToDo')).toBe('To Do')
    expect(statusLabel('InProgress')).toBe('In Progress')
    expect(statusLabel('Paused')).toBe('Paused')
    expect(statusLabel('Done')).toBe('Done')
  })

  test('falls back to the raw key when unknown', () => {
    expect(statusLabel('Unknown')).toBe('Unknown')
  })
})

describe('fmtFull', () => {
  test('keeps the first 16 characters with a space separator', () => {
    expect(fmtFull('2026-05-25 09:42:00')).toBe('2026-05-25 09:42')
    expect(fmtFull('2026-05-25T09:42:00')).toBe('2026-05-25 09:42')
  })

  test('falls back to an em-dash for empty input', () => {
    expect(fmtFull(null)).toBe('—')
    expect(fmtFull(undefined)).toBe('—')
    expect(fmtFull('')).toBe('—')
  })
})

describe('fmtDate', () => {
  test('returns the date portion only', () => {
    expect(fmtDate('2026-05-25 09:42:00')).toBe('2026-05-25')
  })

  test('falls back for empty input', () => {
    expect(fmtDate(null)).toBe('—')
  })
})

describe('STATUS_META and PRIORITY_META', () => {
  test('STATUS_META covers every status the backend allows', () => {
    const keys = STATUS_META.map(s => s.key)
    expect(keys).toEqual(['ToDo', 'InProgress', 'Paused', 'Done'])
  })

  test('every status has a ring color used by the dashboard donuts', () => {
    for (const meta of STATUS_META) {
      expect(meta.ring).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  test('PRIORITY_META covers every priority the backend allows', () => {
    const keys = PRIORITY_META.map(p => p.key)
    expect(keys).toEqual(['High', 'Medium', 'Low'])
  })
})
