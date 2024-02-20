import { ReadableStream } from 'stream/web';

export type FileMetadata = {
  key: string;
  lastModified?: Date;
  mimeType?: string;
  size?: number;
};

export type File = FileMetadata & {
  content: ReadableStream;
};

export type ListFilesOptions = {
  prefix?: string;
  continuationToken?: string;
  maxResults?: number;
};

export type ListFilesResult = {
  files: FileMetadata[];
  count: number;
  continuationToken?: string;
};
