import { uploadToS3 } from "@/lib/s3";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const path = formData.get("path") || "";

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer for S3 upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Patch the file object to be compatible with uploadToS3 if it expects a browser File
    // Our uploadToS3 uses @aws-sdk/lib-storage which accepts Buffer
    const result = await uploadToS3(buffer, path, file.name, file.type);

    return Response.json(result);
  } catch (error) {
    console.error("Upload Route Error:", error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
