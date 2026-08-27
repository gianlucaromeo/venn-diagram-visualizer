/**
 * Evaluator: syntax tree -> region bitmask.
 */

import { NodeType } from './parser.js';
import {
  SETS,
  UNIVERSE,
  EMPTY,
  intersection,
  union,
  difference,
  complement,
} from './masks.js';

/**
 * @param {object} node AST node produced by `parse`.
 * @returns {number} Region bitmask of the set the expression denotes.
 */
export function evaluate(node) {
  switch (node.type) {
    case NodeType.SET:
      return SETS[node.name];
    case NodeType.UNIVERSE:
      return UNIVERSE;
    case NodeType.EMPTY:
      return EMPTY;
    case NodeType.COMPLEMENT:
      return complement(evaluate(node.operand));
    case NodeType.INTERSECTION:
      return intersection(evaluate(node.left), evaluate(node.right));
    case NodeType.UNION:
      return union(evaluate(node.left), evaluate(node.right));
    case NodeType.DIFFERENCE:
      return difference(evaluate(node.left), evaluate(node.right));
    default:
      throw new Error(`Unknown node type "${node.type}"`);
  }
}
