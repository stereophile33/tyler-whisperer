export const runtime = 'nodejs';
export const maxDuration = 30;

async function extractPdf(buffer) {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractDocx(buffer) {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractPptx(buffer) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0]);
      const nb = parseInt(b.match(/\d+/)[0]);
      return na - nb;
    });
  let text = '';
  for (const file of slideFiles) {
    const xml = await zip.files[file].async('string');
    const matches = xml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
    const slideText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').trim();
    if (slideText) text += slideText + '\n\n';
  }
  return text;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const name = file.name.toLowerCase();
    let text = '';
    if (name.endsWith('.pdf')) text = await extractPdf(buffer);
    else if (name.endsWith('.docx')) text = await extractDocx(buffer);
    else if (name.endsWith('.pptx')) text = await extractPptx(buffer);
    else if (name.endsWith('.txt') || name.endsWith('.md')) text = buffer.toString('utf-8');
    else return Response.json({ error: 'Unsupported file type. Use PDF, DOCX, PPTX, or TXT.' }, { status: 400 });
    text = text.replace(/\s+/g, ' ').trim();
    if (!text) return Response.json({ error: 'Could not extract text from file.' }, { status: 400 });
    return Response.json({ text, filename: file.name });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
