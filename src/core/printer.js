/**
 * Pretty-printer: syntax tree -> expression string.
 *
 * Emits the minimal parentheses needed to reparse to an equivalent tree.
 * Union binds loosest; intersection and difference share a level; the
 * postfix complement binds tightest.
 */

import { NodeType } from './parser.js';

const PRECEDENCE = {
  [NodeType.UNION]: 1,
  [NodeType.INTERSECTION]: 2,
  [NodeType.DIFFERENCE]: 2,
  [NodeType.COMPLEMENT]: 3,
  [NodeType.SET]: 4,
  [NodeType.UNIVERSE]: 4,
  [NodeType.EMPTY]: 4,
};

const BINARY_SYMBOL = {
  [NodeType.UNION]: '|',
  [NodeType.INTERSECTION]: '&',
  [NodeType.DIFFERENCE]: '-',
};

/**
 * @param {object} node AST node produced by `parse`.
 * @returns {string} An expression that parses back to an equivalent tree.
 */
export function print(node) {
  switch (node.type) {
    case NodeType.SET:
      return node.name;
    case NodeType.UNIVERSE:
      return 'U';
    case NodeType.EMPTY:
      return '0';
    case NodeType.COMPLEMENT:
      return `${child(node.operand, PRECEDENCE[node.type], false)}'`;
    case NodeType.UNION:
    case NodeType.INTERSECTION:
    case NodeType.DIFFERENCE: {
      const prec = PRECEDENCE[node.type];
      const left = child(node.left, prec, false);
      const right = child(node.right, prec, true);
      return `${left} ${BINARY_SYMBOL[node.type]} ${right}`;
    }
    default:
      throw new Error(`Unknown node type "${node.type}"`);
  }
}

// Binary operators are left-associative, so a right child at the same
// precedence level must keep its parentheses (`A - (B - C)` ≠ `A - B - C`).
function child(node, parentPrecedence, isRightChild) {
  const text = print(node);
  const precedence = PRECEDENCE[node.type];
  const needsParens = isRightChild
    ? precedence <= parentPrecedence
    : precedence < parentPrecedence;
  return needsParens ? `(${text})` : text;
}
