import { FieldValue, Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  createdAt: Timestamp | FieldValue;
}

export interface Album {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  createdAt: Timestamp | FieldValue;
  photoCount: number;
  coverPhotoUrl: string;
}

export interface Photo {
  id: string;
  url: string;
  title: string;
  description: string;
  albumId: string;
  ownerId: string;
  createdAt: Timestamp | FieldValue;
  isFavorite: boolean;
  tags: string[];
}
