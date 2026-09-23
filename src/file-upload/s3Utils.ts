import * as path from 'path';
import { randomUUID } from 'crypto';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { MAX_FILE_SIZE_BYTES } from './validation';

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
  },
});

type S3Upload = {
  fileType: string;
  fileName: string;
  userId: string;
};

export const getUploadFileSignedURLFromS3 = async ({ fileName, fileType, userId }: S3Upload) => {
  const key = getS3Key(fileName, userId);

  const { url: s3UploadUrl, fields: s3UploadFields } = await createPresignedPost(s3Client, {
    Bucket: process.env.AWS_S3_FILES_BUCKET!,
    Key: key,
    Conditions: [['content-length-range', 0, MAX_FILE_SIZE_BYTES]],
    Fields: {
      'Content-Type': fileType,
    },
    Expires: 3600,
  });

  return { s3UploadUrl, key, s3UploadFields };
};

export const getDownloadFileSignedURLFromS3 = async ({ key }: { key: string }) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_FILES_BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

function getS3Key(fileName: string, userId: string) {
  const ext = path.extname(fileName).slice(1);
  return `${userId}/${randomUUID()}.${ext}`;
}

/* -------------------------------------------------------------------------- */
/*  Question images (admin-uploaded radiographs, clinical photos, etc.)        */
/*  Same private-bucket/signed-URL setup as user file uploads above, just a    */
/*  different key prefix -- keyed by questionId, not userId.                   */
/* -------------------------------------------------------------------------- */

export const getQuestionImageUploadSignedURL = async ({
  questionId,
  fileName,
  fileType,
}: {
  questionId: string;
  fileName: string;
  fileType: string;
}) => {
  const ext = path.extname(fileName).slice(1);
  const key = `question-images/${questionId}/${randomUUID()}.${ext}`;

  const { url: s3UploadUrl, fields: s3UploadFields } = await createPresignedPost(s3Client, {
    Bucket: process.env.AWS_S3_FILES_BUCKET!,
    Key: key,
    Conditions: [['content-length-range', 0, MAX_FILE_SIZE_BYTES]],
    Fields: { 'Content-Type': fileType },
    Expires: 3600,
  });

  return { s3UploadUrl, s3UploadFields, key };
};

/** Question.imageUrl stores the S3 *key*, not a usable URL (private bucket) --
 * this mints a fresh short-lived signed URL at read time. Never persist the
 * result; it expires. Returns null through for a null/empty key so callers
 * can pass Question.imageUrl straight in. */
export const resolveOptionalImageUrl = async (key: string | null): Promise<string | null> => {
  if (!key) return null;
  return getDownloadFileSignedURLFromS3({ key });
};

/* -------------------------------------------------------------------------- */
/*  Public images (PRD-007 blog covers, testimonial avatars) -- deliberately   */
/*  NOT the same private-bucket/signed-URL pattern as question images above.   */
/*  These need a stable, permanent URL: they appear in Open Graph tags,       */
/*  JSON-LD `image` fields, and social-preview caches, none of which can       */
/*  tolerate a URL that expires in an hour. Requires each prefix below to      */
/*  have a bucket policy allowing public `s3:GetObject` -- see                */
/*  docs/18-blog-content-plan-PRD-007.md for the exact policy JSON and setup   */
/*  steps. Same bucket/IAM user as question images, no new env vars needed.    */
/* -------------------------------------------------------------------------- */

async function getPublicImageUploadSignedURL({
  keyPrefix,
  fileName,
  fileType,
}: {
  keyPrefix: string;
  fileName: string;
  fileType: string;
}) {
  const ext = path.extname(fileName).slice(1);
  const key = `${keyPrefix}/${randomUUID()}.${ext}`;

  const { url: s3UploadUrl, fields: s3UploadFields } = await createPresignedPost(s3Client, {
    Bucket: process.env.AWS_S3_FILES_BUCKET!,
    Key: key,
    Conditions: [['content-length-range', 0, MAX_FILE_SIZE_BYTES]],
    Fields: { 'Content-Type': fileType },
    Expires: 3600,
  });

  return { s3UploadUrl, s3UploadFields, key, publicUrl: getPublicImageUrl(key) };
}

/** Plain string interpolation, not a signed call -- the object must already
 * be public via the relevant prefix's bucket policy for this URL to actually
 * resolve. Returns null through for a null/empty key so callers can pass a
 * stored *ImageKey column straight in. */
export function getPublicImageUrl(key: string | null): string | null {
  if (!key) return null;
  return `https://${process.env.AWS_S3_FILES_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
}

export const getBlogImageUploadSignedURL = (args: { fileName: string; fileType: string }) =>
  getPublicImageUploadSignedURL({ ...args, keyPrefix: 'blog-images' });

export const getTestimonialImageUploadSignedURL = (args: { fileName: string; fileType: string }) =>
  getPublicImageUploadSignedURL({ ...args, keyPrefix: 'testimonial-images' });
