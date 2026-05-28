import { PDFParse } from "pdf-parse";

export async function extractPdfText(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    return {
      text: result.text || "",
      pages: result.total || 0,
    };
  } finally {
    await parser.destroy();
  }
}
