import { SDText } from '../models/HomeFilter';

interface SDTextContentProps {
  value: SDText;
}

/**
 * Renders server-driven text according to its contract.
 *
 * HTML values are already escaped/sanitized by the server, so React must parse
 * the markup once instead of rendering the HTML source as a plain string.
 */
export function SDTextContent({ value }: SDTextContentProps) {
  if (!value.isHtml) return <>{value.text}</>;

  return (
    <span
      className="sd-text-html"
      dangerouslySetInnerHTML={{ __html: value.text }}
    />
  );
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: '\u00a0',
  quot: '"',
};

/**
 * Converts SDText to plain text for non-DOM consumers such as map marker titles.
 */
export function sdTextToPlainText(value: SDText): string {
  if (!value.isHtml) return value.text;

  return value.text
    .replace(/<[^>]+>/g, '')
    .replace(/&(#(?:x[\da-f]+|\d+)|[a-z]+);/gi, (entity, code: string) => {
      if (code[0] !== '#') return HTML_ENTITIES[code.toLowerCase()] ?? entity;

      const isHex = code[1]?.toLowerCase() === 'x';
      const codePoint = Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return entity;
      }
    })
    .trim();
}
