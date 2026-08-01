import { absoluteUrl } from "../cms/utils";

export function buildArticlePreviewUrl(token: string) {
  return absoluteUrl(`/preview/articles/${token}`);
}
