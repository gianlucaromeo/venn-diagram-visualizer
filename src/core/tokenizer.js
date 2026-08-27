/**
 * Tokenizer: expression string -> token array.
 *
 * Tokens carry their source position so later stages can report errors
 * pointing at the offending character.
 */

export const TokenType = Object.freeze({
  SET: 'SET',
  UNIVERSE: 'UNIVERSE',
  EMPTY: 'EMPTY',
  NOT: 'NOT',
  AND: 'AND',
  OR: 'OR',
  MINUS: 'MINUS',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  EOF: 'EOF',
});

export class TokenizeError extends Error {
  constructor(message, position) {
    super(message);
    this.name = 'TokenizeError';
    this.position = position;
  }
}

// Note the one deliberate asymmetry: lowercase `u` is a legacy alias for
// union while uppercase `U` is the universe. `|` is the canonical union
// symbol, so this stays unambiguous as long as sets are single letters.
const SINGLE_CHAR_TOKENS = new Map([
  ['A', { type: TokenType.SET, value: 'A' }],
  ['a', { type: TokenType.SET, value: 'A' }],
  ['B', { type: TokenType.SET, value: 'B' }],
  ['b', { type: TokenType.SET, value: 'B' }],
  ['C', { type: TokenType.SET, value: 'C' }],
  ['c', { type: TokenType.SET, value: 'C' }],
  ['U', { type: TokenType.UNIVERSE }],
  ['1', { type: TokenType.UNIVERSE }],
  ['0', { type: TokenType.EMPTY }],
  ['∅', { type: TokenType.EMPTY }],
  ["'", { type: TokenType.NOT }],
  ['’', { type: TokenType.NOT }],
  ['∁', { type: TokenType.NOT }],
  ['&', { type: TokenType.AND }],
  ['∩', { type: TokenType.AND }],
  ['*', { type: TokenType.AND }],
  ['|', { type: TokenType.OR }],
  ['∪', { type: TokenType.OR }],
  ['+', { type: TokenType.OR }],
  ['u', { type: TokenType.OR }],
  ['-', { type: TokenType.MINUS }],
  ['−', { type: TokenType.MINUS }],
  ['\\', { type: TokenType.MINUS }],
  ['∖', { type: TokenType.MINUS }],
  ['(', { type: TokenType.LPAREN }],
  [')', { type: TokenType.RPAREN }],
]);

/**
 * @param {string} input
 * @returns {Array<{type: string, value?: string, position: number}>}
 *   Token list, always terminated by an EOF token.
 * @throws {TokenizeError} on the first unrecognized character.
 */
export function tokenize(input) {
  const tokens = [];
  // Iterate by code point so astronomically wide characters (e.g. emoji)
  // produce one error at the right index instead of two.
  let position = 0;
  for (const char of input) {
    if (!/\s/.test(char)) {
      const spec = SINGLE_CHAR_TOKENS.get(char);
      if (!spec) {
        throw new TokenizeError(`Unexpected character "${char}"`, position);
      }
      tokens.push({ ...spec, position });
    }
    position += char.length;
  }
  tokens.push({ type: TokenType.EOF, position: input.length });
  return tokens;
}
