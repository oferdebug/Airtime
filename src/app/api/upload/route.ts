import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { ALLOWED_AUDIO_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

/**
 * Vercel Blob client upload handler.
 * Generates client tokens for browser uploads and validates pathname/size/content type.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_AUDIO_TYPES,
        maximumSizeInBytes: MAX_FILE_SIZE,
        addRandomSuffix: true,
      }),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
