import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';

// GET /api/advances/[id]/file - Download the original uploaded file from real storage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const advance = await prisma.advance.findUnique({
      where: { id },
    });

    if (!advance || !advance.filePath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(advance.filePath);

    const fileName = advance.fileName || 'document.pdf';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('File download error:', error);
    return NextResponse.json({ error: 'Error downloading file' }, { status: 500 });
  }
}