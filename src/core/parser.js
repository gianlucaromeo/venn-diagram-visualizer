/**
 * Recursive-descent parser: tokens -> abstract syntax tree.
 *
 * Grammar, loosest binding first:
 *
 *   union  -> inter ( '|' inter )*
 *   inter  -> post  ( ('&' | '-') post )*
 *   post   -> prim "'"*
 *   prim   -> '(' union ')' | A | B | C | U | 0
 *
 * `&` and `-` share one left-associative level, so `A-B-C` parses as
 * `(A-B)-C`. The tree is kept (rather than evaluating inline) so callers
 * can pretty-print, report positions, and inspect subexpressions.
 */

import { tokenize, TokenType } from './tokenizer.js';

export const NodeType = Object.freeze({
  SET: 'set',
  UNIVERSE: 'universe',
  EMPTY: 'empty',
  COMPLEMENT: 'complement',
  INTERSECTION: 'intersection',
  UNION: 'union',
  DIFFERENCE: 'difference',
});

export class ParseError extends Error {
  constructor(message, position) {
    super(message);
    this.name = 'ParseError';
    this.position = position;
  }
}

const BINARY_NODE_BY_TOKEN = {
  [TokenType.AND]: NodeType.INTERSECTION,
  [TokenType.OR]: NodeType.UNION,
  [TokenType.MINUS]: NodeType.DIFFERENCE,
};

/**
 * @param {string} input
 * @returns {object} AST root node; every node carries a `position`.
 * @throws {TokenizeError | ParseError}
 */
export function parse(input) {
  const tokens = tokenize(input);
  let index = 0;

  const peek = () => tokens[index];
  const next = () => tokens[index++];

  function describe(token) {
    return token.type === TokenType.EOF
      ? 'end of input'
      : `"${input[token.position]}"`;
  }

  function parseUnion() {
    let node = parseIntersection();
    while (peek().type === TokenType.OR) {
      const op = next();
      node = {
        type: NodeType.UNION,
        left: node,
        right: parseIntersection(),
        position: op.position,
      };
    }
    return node;
  }

  function parseIntersection() {
    let node = parsePostfix();
    while (peek().type === TokenType.AND || peek().type === TokenType.MINUS) {
      const op = next();
      node = {
        type: BINARY_NODE_BY_TOKEN[op.type],
        left: node,
        right: parsePostfix(),
        position: op.position,
      };
    }
    return node;
  }

  function parsePostfix() {
    let node = parsePrimary();
    while (peek().type === TokenType.NOT) {
      const op = next();
      node = { type: NodeType.COMPLEMENT, operand: node, position: op.position };
    }
    return node;
  }

  function parsePrimary() {
    const token = next();
    switch (token.type) {
      case TokenType.SET:
        return { type: NodeType.SET, name: token.value, position: token.position };
      case TokenType.UNIVERSE:
        return { type: NodeType.UNIVERSE, position: token.position };
      case TokenType.EMPTY:
        return { type: NodeType.EMPTY, position: token.position };
      case TokenType.LPAREN: {
        const node = parseUnion();
        const closing = next();
        if (closing.type !== TokenType.RPAREN) {
          throw new ParseError(
            `Expected ")" but found ${describe(closing)}`,
            closing.position,
          );
        }
        return node;
      }
      default:
        throw new ParseError(
          `Expected a set, "U", "0", or "(" but found ${describe(token)}`,
          token.position,
        );
    }
  }

  if (peek().type === TokenType.EOF) {
    throw new ParseError('Empty expression', 0);
  }
  const root = parseUnion();
  const trailing = peek();
  if (trailing.type !== TokenType.EOF) {
    throw new ParseError(
      `Unexpected ${describe(trailing)} after the expression`,
      trailing.position,
    );
  }
  return root;
}
