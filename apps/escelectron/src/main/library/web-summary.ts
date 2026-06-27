import { saveWebSummaryToResources } from '../resources/resource-service';

/** @deprecated use saveWebSummaryToResources */
export async function saveWebSummaryToLibrary(
  title: string,
  summary: string,
  courseId?: string | null,
) {
  return saveWebSummaryToResources(title, summary, courseId);
}
