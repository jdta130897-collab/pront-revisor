import { NextRequest, NextResponse } from 'next/server';
import { extractPdfText } from '@/lib/pdf';
import mammoth from 'mammoth';

// Force Node.js runtime (required for pdf-parse and mammoth)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';
    let fileType: 'pdf' | 'docx' | 'txt' = 'txt';
    let pages: number | undefined;

    if (fileName.endsWith('.pdf')) {
      fileType = 'pdf';
      const pdfData = await extractPdfText(buffer);
      extractedText = pdfData.text || '';
      pages = pdfData.pages;
    } else if (fileName.endsWith('.docx')) {
      fileType = 'docx';
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
    } else if (fileName.endsWith('.txt')) {
      fileType = 'txt';
      extractedText = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: 'Tipo de archivo no soportado. Solo PDF, DOCX y TXT.' },
        { status: 400 }
      );
    }

    // Clean up the text a bit
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType,
      wordCount,
      text: extractedText,
      // Useful metadata for future features
      metadata: {
        pages,
      },
    });
  } catch (error: any) {
    console.error('Error extracting text:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar el documento',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
