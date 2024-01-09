import { HydratedDocument, InferSchemaType, Schema, model } from 'mongoose';
import { Collections } from './collections';

export const CertificationSchema = new Schema(
  {
    _id: { type: String, required: true },
    agency: { type: String, required: true },
    course: { type: String, required: true },
  },
  { collection: Collections.KnownCertifications },
);

export type CertificationData = InferSchemaType<typeof CertificationSchema>;
export type CertificationDocument = HydratedDocument<CertificationData>;
export const CertificationModel = model('Certification', CertificationSchema);
