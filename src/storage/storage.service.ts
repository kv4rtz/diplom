import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extension } from 'mime-types';
import { InjectS3, type S3 } from 'nestjs-s3';
import path from 'path';
import { getEnumValues } from 'src/global/utils/getEnumValues';
import {
  getAllowGetPolicy,
  OpenForReadBuckets,
  StorageBuckets,
} from './buckets.enum';

@Injectable()
export class StorageService {
  constructor(@InjectS3() private readonly s3: S3) {}

  async createBuckets() {
    try {
      await Promise.all(
        getEnumValues(StorageBuckets).map((bucket) =>
          this.s3.createBucket({ Bucket: bucket }),
        ),
      );
    } catch {}
  }

  async allowReadForOpenBuckets() {
    try {
      await Promise.all(
        getEnumValues(OpenForReadBuckets).map((bucket) =>
          this.s3.putBucketPolicy({
            Bucket: bucket,
            Policy: getAllowGetPolicy(bucket),
          }),
        ),
      );
    } catch {}
  }

  async getUploadUrl(mimeType: string, bucket: StorageBuckets) {
    const key = `${randomUUID()}.${extension(mimeType)}`;

    const command = new PutObjectCommand({
      Bucket: bucket.toString(),
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 300,
    });

    return { uploadUrl, fileKey: key };
  }

  async uploadFile(file: Buffer, fileName: string, bucket: StorageBuckets) {
    const key = `${randomUUID()}${path.extname(fileName)}`;

    const command = new PutObjectCommand({
      Bucket: bucket.toString(),
      Key: key,
      Body: file,
    });

    await this.s3.send(command);

    return key;
  }

  async getUploadUrls(uploads: { mimeType: string; bucket: StorageBuckets }[]) {
    const urls: { fileKey: string; uploadUrl: string }[] = [];
    for (const upload of uploads) {
      const url = await this.getUploadUrl(upload.mimeType, upload.bucket);
      urls.push({ fileKey: url.fileKey, uploadUrl: url.uploadUrl });
    }
    return urls;
  }

  async fileExists(fileKey: string, bucket: StorageBuckets) {
    try {
      await this.s3.headObject({
        Bucket: bucket.toString(),
        Key: fileKey,
      });
      return true;
    } catch {
      return false;
    }
  }

  async checkFileMimeType(
    fileKey: string,
    allowedMimeTypes: string[],
    bucket: StorageBuckets,
  ) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket.toString(),
        Key: fileKey,
      });

      const object = await this.s3.send(command);

      return allowedMimeTypes.includes(object.ContentType!);
    } catch {
      return false;
    }
  }

  async deleteFile(fileKey: string, bucket: StorageBuckets) {
    try {
      await this.s3.deleteObject({
        Bucket: bucket.toString(),
        Key: fileKey,
      });
    } catch (e) {
      console.log(e);
    }
  }

  async getBufferFile(fileKey: string, bucket: StorageBuckets) {
    const command = new GetObjectCommand({
      Bucket: bucket.toString(),
      Key: fileKey,
    });

    const s3Object = await this.s3.send(command);

    const chunks: Uint8Array[] = [];
    for await (const chunk of s3Object.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async getDownloadUrl(
    fileKey: string,
    bucket: StorageBuckets,
  ): Promise<string> {
    return await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: bucket.toString(),
        Key: fileKey,
      }),
    );
  }

  async makeCopyFile(fileKey: string, bucket: StorageBuckets) {
    const newKey = randomUUID() + path.extname(fileKey);

    await this.s3.copyObject({
      Bucket: bucket.toString(),
      CopySource: `/${bucket.toString()}/${fileKey}`,
      Key: newKey,
    });

    return newKey;
  }

  async makeCopyFiles(objects: { fileKey: string; bucket: StorageBuckets }[]) {
    const newKeys: string[] = [];

    for await (const { fileKey, bucket } of objects) {
      const newKey = randomUUID() + path.extname(fileKey);

      await this.s3.copyObject({
        Bucket: bucket.toString(),
        CopySource: `/${bucket.toString()}/${fileKey}`,
        Key: newKey,
      });

      newKeys.push(newKey);
    }

    return newKeys;
  }
}
