// types/firebase.ts
import { User } from 'firebase/auth';
import { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';

export type FirebaseUser = User;

export interface BaseDocument {
  id?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserProfile extends BaseDocument {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

export type FirestoreDocument<T = DocumentData> = QueryDocumentSnapshot<T>;

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}