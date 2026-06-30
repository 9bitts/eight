"use server";

import { getPostEditHistory } from "@/lib/post-edits";

export async function fetchPostEditHistory(postId: string) {
  return getPostEditHistory(postId);
}
