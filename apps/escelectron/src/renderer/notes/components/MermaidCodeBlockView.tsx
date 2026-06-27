import { useEffect, useId, useRef, useState } from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

const MERMAID_TEMPLATE = `flowchart TD
  A[Başla] --> B{Karar}
  B -->|Evet| C[Bitir]
  B -->|Hayır| D[Alternatif]
  D --> C`;

export function MermaidCodeBlockView({ node, selected }: NodeViewProps) {
  const isMermaid = node.attrs.language === 'mermaid';
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const renderId = useId().replace(/:/g, '');
  const source = node.textContent;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isMermaid) {
      return;
    }
    if (selected) {
      setSvg('');
      setError(null);
      return;
    }
    if (!source.trim()) {
      setSvg('');
      setError(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void (async () => {
        try {
          const mermaid = await import('mermaid');
          mermaid.default.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
          });
          const { svg: rendered } = await mermaid.default.render(`mmd-${renderId}`, source);
          setSvg(rendered);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
          setSvg('');
        }
      })();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [isMermaid, renderId, selected, source]);

  if (!isMermaid) {
    return (
      <NodeViewWrapper className="code-block-view">
        <pre>
          <code>
            <NodeViewContent />
          </code>
        </pre>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="mermaid-block" data-language="mermaid">
      {selected ? (
        <pre className="mermaid-block__source">
          <code>
            <NodeViewContent />
          </code>
        </pre>
      ) : (
        <div className="mermaid-block__preview-wrap">
          {error ? (
            <p className="mermaid-block__error" role="alert">
              {error}
            </p>
          ) : svg ? (
            <div
              className="mermaid-block__preview"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <p className="mermaid-block__placeholder">{MERMAID_TEMPLATE.split('\n')[0]}…</p>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
}

export { MERMAID_TEMPLATE };
