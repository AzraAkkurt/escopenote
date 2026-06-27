import fs from 'node:fs/promises';
import path from 'node:path';
import type { LibraryFileType } from '../../../shared/library-types';
import { IpcError } from '../../../shared/ipc-errors';

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCsv(text: string): string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line, index) => `Row ${index + 1}: ${line}`).join('\n');
}

function parseJson(text: string): string {
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed === 'string') {
    return parsed;
  }
  return JSON.stringify(parsed, null, 2);
}

async function parsePdf(filePath: string): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text?.trim() ?? '';
  } finally {
    await parser.destroy();
  }
}

async function parseDocx(filePath: string): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value?.trim() ?? '';
}

export async function parseFileToText(
  filePath: string,
  type: LibraryFileType,
): Promise<string> {
  try {
    if (type === 'pdf') {
      const text = await parsePdf(filePath);
      if (!text) {
        throw new IpcError('VALIDATION_ERROR', 'No extractable text in PDF');
      }
      return text;
    }

    if (type === 'docx') {
      const text = await parseDocx(filePath);
      if (!text) {
        throw new IpcError('VALIDATION_ERROR', 'No extractable text in DOCX');
      }
      return text;
    }

    const raw = await fs.readFile(filePath, 'utf8');

    switch (type) {
      case 'html':
        return stripHtml(raw);
      case 'csv':
        return parseCsv(raw);
      case 'json':
        try {
          return parseJson(raw);
        } catch {
          throw new IpcError('VALIDATION_ERROR', 'Invalid JSON file');
        }
      case 'txt':
      case 'md':
      case 'unknown':
        return raw.trim();
      default:
        return raw.trim();
    }
  } catch (error) {
    if (error instanceof IpcError) {
      throw error;
    }
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      throw new IpcError('NOT_FOUND', `File not found: ${path.basename(filePath)}`);
    }
    throw new IpcError(
      'VALIDATION_ERROR',
      `Could not read file: ${path.basename(filePath)}. It may be corrupt or unsupported.`,
    );
  }
}
