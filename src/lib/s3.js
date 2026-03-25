import { Upload } from "@aws-sdk/lib-storage";
import { s3Client, S3_BUCKET_NAME, S3_PREFIX } from "./aws";

export async function uploadToS3(
  body,
  path = "",
  originalName = "file",
  contentType = "application/octet-stream",
) {
  const fileName = `${Date.now()}-${originalName}`;
  const key = `${S3_PREFIX}${path}${fileName}`;

  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
    });

    await upload.done();

    const region =
      process.env.S3_REGION || process.env.AWS_REGION || "ap-south-1";
    const url = `https://${S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;

    return { url, key };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw error;
  }
}
