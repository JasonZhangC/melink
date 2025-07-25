import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const form = await request.formData();
    const title = form.get('title') as string | null;
    const videoFile = form.get('video') as File | null;
    const transcription = form.get('transcription') as string | null;
    const summary = form.get('summary') as string | null;

    if (!title || !videoFile || !transcription || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 },
      );
    }
    
    // Sanitize the title to be URL-friendly
    const slug = title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (!slug) {
      return NextResponse.json(
          { error: 'Invalid title. Please use a title that can be converted into a URL-friendly slug.' },
          { status: 400 },
        );
    }

    // Upload video
    const videoBlob = await put(videoFile.name, videoFile, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Create text blobs and upload them
    const transcriptionBlob = await put(`${slug}-transcription.txt`, transcription, {
        access: 'public',
        addRandomSuffix: true,
    });

    const summaryBlob = await put(`${slug}-summary.txt`, summary, {
        access: 'public',
        addRandomSuffix: true,
    });

    // Store the URLs in Vercel KV
    const data = {
      title: title, // Store original title as well
      videoUrl: videoBlob.url,
      transcriptionUrl: transcriptionBlob.url,
      summaryUrl: summaryBlob.url,
      createdAt: new Date().toISOString(),
    };

    await kv.set(slug, data);

    // Return the path for the user to be redirected to
    return NextResponse.json({ url: `/${slug}` });

  } catch (error: Error | unknown) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    );
  }
}
