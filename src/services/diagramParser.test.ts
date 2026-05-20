import { describe, it, expect } from 'vitest'
import { parseDiagramResponse } from './diagramParser'

describe('parseDiagramResponse', () => {
  it('parses a clean JSON array', () => {
    const raw = '[{"type":"rectangle","x":10,"y":20,"width":100,"height":50,"strokeColor":"#000","backgroundColor":"transparent"}]'
    const result = parseDiagramResponse(raw)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('rectangle')
    expect(result[0].x).toBe(10)
  })

  it('strips a markdown code fence', () => {
    const raw = '```json\n[{"type":"ellipse","x":0,"y":0,"width":40,"height":40}]\n```'
    const result = parseDiagramResponse(raw)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('ellipse')
  })

  it('extracts the array when the model adds prose around it', () => {
    const raw = 'Here is your diagram: [{"type":"diamond","x":5,"y":5,"width":30,"height":30}] Done!'
    const result = parseDiagramResponse(raw)
    expect(result[0].type).toBe('diamond')
  })

  it('fills in defaults for missing fields', () => {
    const result = parseDiagramResponse('[{"type":"rectangle"}]')
    expect(result[0].width).toBe(120)
    expect(result[0].height).toBe(80)
    expect(result[0].strokeColor).toBe('#000000')
    expect(result[0].backgroundColor).toBe('transparent')
    expect(typeof result[0].x).toBe('number')
  })

  it('defaults a missing type to rectangle', () => {
    const result = parseDiagramResponse('[{"x":1,"y":2}]')
    expect(result[0].type).toBe('rectangle')
  })

  it('throws a helpful error when the model returns prose instead of JSON', () => {
    expect(() => parseDiagramResponse('Sure, I can create that diagram for you.'))
      .toThrow(/description instead of diagram data/)
  })

  it('throws when the response has no array at all', () => {
    expect(() => parseDiagramResponse('the answer is 42')).toThrow(/did not return valid diagram data/)
  })

  it('throws on malformed JSON', () => {
    expect(() => parseDiagramResponse('[{"type":"rectangle", x:}]')).toThrow(/malformed JSON/)
  })

  it('throws on an empty array', () => {
    expect(() => parseDiagramResponse('[]')).toThrow(/empty diagram/)
  })
})
