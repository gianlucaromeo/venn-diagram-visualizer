/**
 * Public surface of the pure core. Nothing in here touches the DOM.
 */

export * from './masks.js';
export { tokenize, TokenType, TokenizeError } from './tokenizer.js';
export { parse, NodeType, ParseError } from './parser.js';
export { evaluate } from './evaluator.js';
export { print } from './printer.js';
export { maskToExpression } from './dnf.js';

import { parse } from './parser.js';
import { evaluate } from './evaluator.js';

/**
 * Convenience: expression string -> region bitmask.
 * @throws {TokenizeError | ParseError}
 */
export function evaluateExpression(input) {
  return evaluate(parse(input));
}
