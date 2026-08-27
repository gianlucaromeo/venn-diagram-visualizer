// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VennDiagram from './VennDiagram.jsx';
import { REGION_COUNT, SETS, UNIVERSE } from '../core/index.js';

afterEach(cleanup);

const regionEl = (container, r) =>
  container.querySelector(`[data-region="${r}"]`);

const shadedRegions = (container) =>
  [...container.querySelectorAll('.venn-region--on')].map((el) =>
    Number(el.dataset.region),
  );

describe('VennDiagram', () => {
  it('renders one clickable element per region', () => {
    const { container } = render(<VennDiagram mask={0} />);
    expect(container.querySelectorAll('[data-region]')).toHaveLength(REGION_COUNT);
  });

  it('shades exactly the regions in the mask', () => {
    // A = regions 1, 3, 5, 7 (all region indices with bit 0 set).
    const { container } = render(<VennDiagram mask={SETS.A} />);
    expect(shadedRegions(container).sort()).toEqual([1, 3, 5, 7]);
  });

  it('shades nothing for the empty set and everything for the universe', () => {
    const empty = render(<VennDiagram mask={0} />);
    expect(shadedRegions(empty.container)).toEqual([]);
    cleanup();
    const full = render(<VennDiagram mask={UNIVERSE} />);
    expect(shadedRegions(full.container)).toHaveLength(REGION_COUNT);
  });

  it('updates shading when the mask prop changes', () => {
    const { container, rerender } = render(<VennDiagram mask={0} />);
    rerender(<VennDiagram mask={0b10000000} />);
    expect(shadedRegions(container)).toEqual([7]);
  });

  it('reports clicks with the region index', () => {
    const onRegionClick = vi.fn();
    const { container } = render(
      <VennDiagram mask={0} onRegionClick={onRegionClick} />,
    );
    fireEvent.click(regionEl(container, 6));
    expect(onRegionClick).toHaveBeenCalledWith(6);
  });

  it('intersects region shapes with the circles they are inside', () => {
    // Region 7 (inside all three sets) needs three nested clips and no mask;
    // region 0 (outside all three) needs a mask and no clips.
    const { container } = render(<VennDiagram mask={0} />);
    let node = regionEl(container, 7);
    let clips = 0;
    while (node.parentElement?.hasAttribute('clip-path')) {
      node = node.parentElement;
      clips++;
    }
    expect(clips).toBe(3);
    expect(regionEl(container, 7).hasAttribute('mask')).toBe(false);
    expect(regionEl(container, 0).hasAttribute('mask')).toBe(true);
  });
});
