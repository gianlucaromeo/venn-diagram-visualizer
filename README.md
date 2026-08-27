# Venn Diagram Visualizer

An interactive three-set Venn diagram that evaluates set expressions as you type.

Enter an expression like `(A-B-C)u(A&B)&C` and the matching regions shade instantly. Click regions to go the other way: the app emits a canonical expression for whatever you shaded. A second input turns the page into an identity checker — two expressions are compared for equality over *all* possible sets, and when they differ, the diagram highlights exactly the regions where they disagree.

## Features

- **Live evaluation** — expressions are parsed and rendered on every keystroke, with precise error positions on invalid input (the previous drawing stays on screen while you type).
- **Identity checking** — enter a second expression to verify identities such as De Morgan's laws. Equality is decided exactly, not by sampling; a mismatch shades the counterexample regions.
- **Reverse mode** — click regions to toggle them and get the canonical (disjunctive normal form) expression back.
- **Permalinks** — the current expressions live in the URL hash, so any state can be bookmarked or shared.
- **Flexible syntax** — ASCII and Unicode operators are interchangeable.

## Syntax

| Operation | Canonical | Aliases |
|---|---|---|
| Sets | `A` `B` `C` | `a` `b` `c` |
| Universe | `U` | `1` |
| Empty set | `0` | `∅` |
| Complement (postfix) | `'` | `’` `∁` |
| Intersection | `&` | `∩` `*` |
| Union | `\|` | `∪` `+` `u` |
| Difference | `-` | `−` `\` `∖` |
| Grouping | `( )` | |

Precedence, tightest first: grouping, then postfix `'`, then `&` and `-` (one left-associative level, so `A-B-C` is `(A-B)-C`), then union. `A u B & C` therefore parses as `A u (B & C)`.

## How it works

Three sets cut the universe into 2³ = 8 disjoint regions, and no expression over A, B, C can distinguish two elements in the same region. Any set-valued expression is therefore fully described by which regions it contains — one byte. Set algebra becomes bitwise arithmetic (`∩` is `&`, `∪` is `|`, complement is `~` masked to the universe), which makes evaluation trivially correct and makes equality of two expressions a single integer comparison.

The code is layered strictly one way:

```
input string
    ↓  tokenizer   characters → tokens (with positions)
    ↓  parser      tokens → syntax tree
    ↓  evaluator   tree → region bitmask
    ↓  renderer    bitmask → shaded SVG regions
```

Everything in [`src/core/`](src/core) is pure and DOM-free: [tokenizer](src/core/tokenizer.js), [recursive-descent parser](src/core/parser.js), [evaluator](src/core/evaluator.js), [pretty-printer](src/core/printer.js), and the [canonical-form generator](src/core/dnf.js). The React [renderer](src/components/VennDiagram.jsx) is deliberately dumb: it reads one bit per region and flips a class — region geometry is done by nested SVG `clipPath`s (intersection) and masks (subtraction), never by computing circle intersections.

## Development

Requires Node 20+.

```sh
npm install
npm run dev      # start the dev server
npm test         # run the test suite once
npm run test:watch
npm run lint
npm run build    # production build in dist/
```

The test suite covers the tokenizer (aliases, positions), parser (precedence, associativity, error positions), classical set identities (De Morgan, distributivity, absorption, complements), an exhaustive round-trip of all 256 masks through the canonical-form generator, a property test of the pretty-printer over random trees, and the renderer's region wiring.

## Roadmap

- Parse-tree hover: highlight the intermediate result of a subexpression.
- Minimal-form output (Quine–McCluskey) alongside the canonical form.
- Auto-graded exercises: match a randomly shaded target.
- Real-data mode: paste element lists per set, see counts per region.

The core already supports any number of sets (`setMask(i, n)` is closed-form); only renderers are set-count specific, so a 4-set ellipse renderer or a Karnaugh-map view can be added without touching the core.

## License

[MIT](LICENSE)
