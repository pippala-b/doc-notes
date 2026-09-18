// Downscale a photo in the browser before upload: phone cameras produce 12MP+
// files; 1600px on the long edge keeps handwriting legible and requests small.
export async function prepareImage(
  file: File,
  maxEdge = 1600,
): Promise<{ mediaType: "image/jpeg"; data: string; previewUrl: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { mediaType: "image/jpeg", data: dataUrl.split(",")[1], previewUrl: dataUrl };
}
