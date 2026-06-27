const NOTE_MARKDOWN_MAX = 4000;

export interface BuildNoteAgentMessageParams {
  userQuestion: string;
  noteTitle: string;
  noteMarkdown: string;
  includeNoteContext: boolean;
  preferWebSearch: boolean;
  labels: {
    preamble: string;
    webHint: string;
    noteTitleLabel: string;
    noteBodyLabel: string;
    emptyNote: string;
    questionLabel: string;
  };
}

export function buildNoteAgentMessage(params: BuildNoteAgentMessageParams): string {
  const parts: string[] = [params.labels.preamble];

  if (params.preferWebSearch) {
    parts.push(params.labels.webHint);
  }

  if (params.includeNoteContext) {
    const body = params.noteMarkdown.trim().slice(0, NOTE_MARKDOWN_MAX) || params.labels.emptyNote;
    parts.push(
      `\n---\n${params.labels.noteTitleLabel}: ${params.noteTitle.trim() || params.labels.emptyNote}\n\n${params.labels.noteBodyLabel}:\n${body}\n---`,
    );
  }

  parts.push(`\n${params.labels.questionLabel}: ${params.userQuestion.trim()}`);
  return parts.join('\n');
}
