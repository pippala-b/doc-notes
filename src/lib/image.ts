// Downscale a photo in the browser before upload: phone cameras produce 12MP+
// files; 1600px on the long edge keeps handwriting legible and requests small.
// Hosted platforms cap a request body (Vercel: 4.5 MB), so each photo also has
// a size budget: six photos plus the note text must fit in one request.
const MAX_BASE64_CHARS = 600_000;
const ATTEMPTS = [
  { maxEdge: 1600, quality: 0.85 },
  { maxEdge: 1600, quality: 0.7 },
  { maxEdge: 1280, quality: 0.7 },
  { maxEdge: 1024, quality: 0.6 },
];

export async function prepareImage(
  file: File,
): Promise<{ mediaType: "image/jpeg"; data: string; previewUrl: string }> {
  const bitmap = await createImageBitmap(file);
  let dataUrl = "";
  for (const { maxEdge, quality } of ATTEMPTS) {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_BASE64_CHARS) break;
  }
  bitmap.close();
  return { mediaType: "image/jpeg", data: dataUrl.split(",")[1], previewUrl: dataUrl };
}
