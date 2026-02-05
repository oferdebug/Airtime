import { auth } from "@clerk/nextjs/server";
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { ALLOWED_AUDIO_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

/**
 * Vercel Blob client upload handler.
 * Generates client tokens for browser uploads and validates pathname/size/content type.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const err = error as Error & { status?: number; statusCode?: number };
    const status = err.status ?? err.statusCode;
    const isClientError =
      typeof status === "number" && status >= 400 && status < 500;
    return NextResponse.json(
      { error: message },
      { status: isClientError ? status : 500 },
    );
  }
}
