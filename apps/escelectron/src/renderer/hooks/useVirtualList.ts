import { useCallback, useEffect, useState, type RefObject } from 'react';

interface VirtualRange {
  startIndex: number;
  endIndex: number;
  offsetTop: number;
  totalHeight: number;
}

export function useVirtualList(
  containerRef: RefObject<HTMLElement | null>,
  itemCount: number,
  rowHeight: number,
  overscan = 3,
): VirtualRange {
  const [range, setRange] = useState<VirtualRange>({
    startIndex: 0,
    endIndex: Math.min(itemCount, 20),
    offsetTop: 0,
    totalHeight: itemCount * rowHeight,
  });

  const update = useCallback(() => {
    const el = containerRef.current;
    if (!el || itemCount === 0) {
      setRange({
        startIndex: 0,
        endIndex: 0,
        offsetTop: 0,
        totalHeight: 0,
      });
      return;
    }

    const scrollTop = el.scrollTop;
    const height = el.clientHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleCount = Math.ceil(height / rowHeight) + overscan * 2;
    const endIndex = Math.min(itemCount, startIndex + visibleCount);

    setRange({
      startIndex,
      endIndex,
      offsetTop: startIndex * rowHeight,
      totalHeight: itemCount * rowHeight,
    });
  }, [containerRef, itemCount, rowHeight, overscan]);

  useEffect(() => {
    update();
    const el = containerRef.current;
    if (!el) {
      return;
    }
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [containerRef, update]);

  return range;
}
