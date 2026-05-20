/**
 * Turns a raw LLM response into a clean array of diagram elements.
 *
 * The model is asked for a bare JSON array, but in practice it sometimes wraps
 * the array in a markdown code fence or adds prose around it. This function
 * strips that noise, parses the array, and fills in sensible defaults for any
 * missing fields. Kept pure (no network) so it can be unit-tested directly.
 */
export interface RawDiagramElement {
  type?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  strokeColor?: string;
  backgroundColor?: string;
  [key: string]: unknown;
}

export function parseDiagramResponse(response: string): RawDiagramElement[] {
  const cleaned = response
    .trim()
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    if (/create|draw|make|generate/i.test(cleaned)) {
      throw new Error(
        'AI provided a description instead of diagram data. Try a more specific prompt like "Create 3 rectangles in a row".'
      );
    }
    throw new Error('AI did not return valid diagram data. The response format was incorrect.');
  }

  let elements: unknown;
  try {
    elements = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('AI returned malformed JSON. Please try again with a simpler prompt.');
  }

  if (!Array.isArray(elements) || elements.length === 0) {
    throw new Error('AI returned an empty diagram. Try describing what you want to create.');
  }

  return elements.map((raw, index): RawDiagramElement => {
    const el: RawDiagramElement = { ...(raw as RawDiagramElement) };
    if (!el.type) el.type = 'rectangle';
    el.x = el.x ?? 100 + (index % 3) * 150;
    el.y = el.y ?? 100 + Math.floor(index / 3) * 150;
    el.width = el.width ?? 120;
    el.height = el.height ?? 80;
    el.strokeColor = el.strokeColor ?? '#000000';
    el.backgroundColor = el.backgroundColor ?? 'transparent';
    return el;
  });
}
