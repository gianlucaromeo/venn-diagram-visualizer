import { useEffect, useMemo, useRef, useState } from 'react';
import VennDiagram from './components/VennDiagram.jsx';
import {
  EMPTY,
  equals,
  evaluateExpression,
  maskToExpression,
  symmetricDifference,
  toggleRegion,
} from './core/index.js';
import './App.css';

const SYMBOLS = ['A', 'B', 'C', '∪', '∩', '−', "'", '(', ')', 'U', '∅'];

function useEvaluated(input) {
  return useMemo(() => {
    if (input.trim() === '') return { empty: true };
    try {
      return { mask: evaluateExpression(input) };
    } catch (error) {
      return { error };
    }
  }, [input]);
}

function readHash() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return {
    expression: params.get('q') ?? 'A ∪ B',
    compare: params.get('vs') ?? '',
  };
}

export default function App() {
  const [expression, setExpression] = useState(() => readHash().expression);
  const [compare, setCompare] = useState(() => readHash().compare);
  const inputRef = useRef(null);

  const result = useEvaluated(expression);
  const compareResult = useEvaluated(compare);

  // On a parse error mid-keystroke, keep showing the last valid drawing.
  // Tracked with the store-previous-render-info pattern (setState during
  // render), which React supports and restarts the render for.
  const [lastGood, setLastGood] = useState(EMPTY);
  const currentMask = result.empty ? EMPTY : result.mask;
  if (currentMask !== undefined && currentMask !== lastGood) {
    setLastGood(currentMask);
  }
  const exprMask = currentMask ?? lastGood;

  const comparing =
    result.mask !== undefined && compareResult.mask !== undefined;
  const areEqual = comparing && equals(result.mask, compareResult.mask);
  // When the two expressions differ, shade exactly the regions where they
  // disagree — a visual counterexample.
  const displayedMask =
    comparing && !areEqual
      ? symmetricDifference(result.mask, compareResult.mask)
      : exprMask;

  useEffect(() => {
    const params = new URLSearchParams();
    if (expression.trim() !== '') params.set('q', expression);
    if (compare.trim() !== '') params.set('vs', compare);
    const hash = params.toString();
    window.history.replaceState(null, '', hash ? `#${hash}` : window.location.pathname);
  }, [expression, compare]);

  function insertSymbol(symbol) {
    const input = inputRef.current;
    const start = input.selectionStart ?? expression.length;
    const end = input.selectionEnd ?? expression.length;
    const next = expression.slice(0, start) + symbol + expression.slice(end);
    setExpression(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + symbol.length, start + symbol.length);
    });
  }

  function handleRegionClick(region) {
    setExpression(maskToExpression(toggleRegion(exprMask, region)));
  }

  return (
    <main className="app">
      <h1>Venn Diagram Visualizer</h1>
      <p className="tagline">
        Type a set expression over A, B, C — or click regions to build one.
      </p>

      <label className="field">
        <span>Expression</span>
        <input
          ref={inputRef}
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="e.g. (A - B - C) ∪ (A ∩ B) ∩ C"
        />
      </label>

      <div className="toolbar" role="toolbar" aria-label="Insert symbol">
        {SYMBOLS.map((symbol) => (
          <button key={symbol} type="button" onClick={() => insertSymbol(symbol)}>
            {symbol}
          </button>
        ))}
      </div>

      {result.error && (
        <pre className="error" aria-live="polite">
          {expression + '\n'}
          {' '.repeat(result.error.position ?? 0) + '^ '}
          {result.error.message}
        </pre>
      )}

      <VennDiagram mask={displayedMask} onRegionClick={handleRegionClick} />

      {result.mask !== undefined && (
        <p className="readout">
          Canonical form: <code>{maskToExpression(result.mask)}</code>
        </p>
      )}

      <section className="identity">
        <label className="field">
          <span>Compare with (optional)</span>
          <input
            value={compare}
            onChange={(e) => setCompare(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder="e.g. A' ∩ B' to check against (A ∪ B)'"
          />
        </label>
        {compareResult.error && (
          <pre className="error" aria-live="polite">
            {compare + '\n'}
            {' '.repeat(compareResult.error.position ?? 0) + '^ '}
            {compareResult.error.message}
          </pre>
        )}
        {comparing && (
          <p className={`verdict ${areEqual ? 'verdict--equal' : 'verdict--differs'}`}>
            {areEqual
              ? 'Equal — the two expressions denote the same set for every A, B, C.'
              : 'Not equal — the shaded regions are where they disagree.'}
          </p>
        )}
      </section>
    </main>
  );
}
