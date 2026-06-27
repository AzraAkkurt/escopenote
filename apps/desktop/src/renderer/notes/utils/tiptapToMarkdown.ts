import { formatWikilink } from '@shared/link-types';
import type { LinkTargetKind } from '@shared/link-types';

type TipTapNode = {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

function applyMarks(text: string, marks?: TipTapNode['marks']): string {
  if (!marks?.length) {
    return text;
  }
  let out = text;
  for (const mark of marks) {
    if (mark.type === 'bold') {
      out = `**${out}**`;
    } else if (mark.type === 'italic') {
      out = `*${out}*`;
    } else if (mark.type === 'strike') {
      out = `~~${out}~~`;
    } else if (mark.type === 'underline') {
      out = `<u>${out}</u>`;
    } else if (mark.type === 'highlight') {
      out = `==${out}==`;
    } else if (mark.type === 'code') {
      out = `\`${out}\``;
    } else if (mark.type === 'link') {
      const href = String(mark.attrs?.href ?? '');
      out = href ? `[${out}](${href})` : out;
    } else if (mark.type === 'wikilink') {
      const kind = (mark.attrs?.targetKind ?? 'note') as LinkTargetKind;
      const id = String(mark.attrs?.targetId ?? '');
      const label = String(mark.attrs?.label ?? out);
      out = formatWikilink(kind, id, label);
    }
  }
  return out;
}

function escapeTableCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function tableToMarkdown(node: TipTapNode): string {
  const rows = node.content ?? [];
  if (rows.length === 0) {
    return '';
  }

  const lines: string[] = [];
  rows.forEach((row, rowIndex) => {
    const cells = (row.content ?? []).map((cell) => {
      const inner = (cell.content ?? []).map((child) => nodeToMarkdown(child)).join('').trim();
      return escapeTableCell(inner);
    });
    lines.push(`| ${cells.join(' | ')} |`);
    if (rowIndex === 0) {
      lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
    }
  });

  return lines.join('\n');
}

function listItemToMarkdown(node: TipTapNode, listDepth: number, ordered: boolean, index = 0): string {
  const indent = '  '.repeat(listDepth);
  const prefix = ordered ? `${index + 1}.` : '-';
  const inner = (node.content ?? [])
    .map((child) => {
      if (child.type === 'bulletList' || child.type === 'orderedList' || child.type === 'taskList') {
        return nodeToMarkdown(child, listDepth + 1);
      }
      return nodeToMarkdown(child, listDepth);
    })
    .filter(Boolean)
    .join('\n');
  return `${indent}${prefix} ${inner}`;
}

function taskItemToMarkdown(node: TipTapNode, listDepth: number): string {
  const checked = Boolean(node.attrs?.checked);
  const indent = '  '.repeat(listDepth);
  const inner = (node.content ?? [])
    .map((child) => {
      if (child.type === 'taskList' || child.type === 'bulletList' || child.type === 'orderedList') {
        return nodeToMarkdown(child, listDepth + 1);
      }
      return nodeToMarkdown(child, listDepth);
    })
    .filter(Boolean)
    .join('\n');
  return `${indent}- [${checked ? 'x' : ' '}] ${inner}`;
}

function nodeToMarkdown(node: TipTapNode, listDepth = 0): string {
  const type = node.type ?? 'paragraph';

  if (type === 'text') {
    return applyMarks(node.text ?? '', node.marks);
  }

  const children = (node.content ?? []).map((child) => nodeToMarkdown(child, listDepth)).join('');

  switch (type) {
    case 'doc':
      return (node.content ?? [])
        .map((child) => nodeToMarkdown(child, listDepth))
        .filter(Boolean)
        .join('\n\n')
        .trim();
    case 'paragraph': {
      const align = node.attrs?.textAlign as string | undefined;
      const body = children || '';
      if (align && align !== 'left') {
        return `<p style="text-align: ${align}">${body}</p>`;
      }
      return body;
    }
    case 'heading': {
      const level = Number(node.attrs?.level ?? 1);
      const prefix = '#'.repeat(Math.min(6, Math.max(1, level)));
      const align = node.attrs?.textAlign as string | undefined;
      const body = children;
      if (align && align !== 'left') {
        return `<h${level} style="text-align: ${align}">${body}</h${level}>`;
      }
      return `${prefix} ${body}`;
    }
    case 'bulletList':
      return (node.content ?? [])
        .map((item) => listItemToMarkdown(item, listDepth, false))
        .filter(Boolean)
        .join('\n');
    case 'orderedList':
      return (node.content ?? [])
        .map((item, i) => listItemToMarkdown(item, listDepth, true, i))
        .filter(Boolean)
        .join('\n');
    case 'taskList':
      return (node.content ?? [])
        .map((item) => taskItemToMarkdown(item, listDepth))
        .filter(Boolean)
        .join('\n');
    case 'listItem':
      return listItemToMarkdown(node, listDepth, false);
    case 'taskItem':
      return taskItemToMarkdown(node, listDepth);
    case 'blockquote':
      return children
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    case 'codeBlock': {
      const language = String(node.attrs?.language ?? '').trim();
      const fence = language ? `\`\`\`${language}` : '```';
      return `${fence}\n${children}\n\`\`\``;
    }
    case 'horizontalRule':
      return '---';
    case 'hardBreak':
      return '\n';
    case 'table':
      return tableToMarkdown(node);
    case 'tableRow':
    case 'tableHeader':
    case 'tableCell':
      return children;
    case 'inlineMath': {
      const latex = String(node.attrs?.latex ?? '');
      return `$${latex}$`;
    }
    case 'blockMath': {
      const latex = String(node.attrs?.latex ?? '');
      return `$$\n${latex}\n$$`;
    }
    default:
      return children;
  }
}

export function tiptapToMarkdown(doc: Record<string, unknown>): string {
  return nodeToMarkdown(doc as TipTapNode);
}
