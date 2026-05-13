import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Album, Photo } from '../types';
import { compressAndEncodeImage } from '../lib/imageUtils';

export function useAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'albums'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Album))
        .sort((a, b) => {
          const timeA = (a.createdAt as any)?.seconds || 0;
          const timeB = (b.createdAt as any)?.seconds || 0;
          return timeB - timeA; // Descending
        });
      setAlbums(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'albums');
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  return { albums, loading };
}

export function usePhotos(albumId: string | null) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    // instructions: always filter by userId AND albumId if provided.
    // Sorting in-memory as requested to avoid index requirements.
    let q = query(
      collection(db, 'photos'),
      where('userId', '==', auth.currentUser.uid)
    );

    if (albumId === 'favorites') {
      q = query(
        collection(db, 'photos'),
        where('userId', '==', auth.currentUser.uid),
        where('isFavorite', '==', true)
      );
    } else if (albumId) {
      q = query(
        collection(db, 'photos'),
        where('userId', '==', auth.currentUser.uid),
        where('albumId', '==', albumId)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Photo))
        .sort((a, b) => {
          const timeA = (a.createdAt as any)?.seconds || 0;
          const timeB = (b.createdAt as any)?.seconds || 0;
          return timeB - timeA;
        });
      setPhotos(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `photos (album: ${albumId})`);
    });

    return () => unsubscribe();
  }, [auth.currentUser, albumId]);

  return { photos, loading };
}

export async function uploadPhoto(data: { file: File, title: string, description: string, albumId: string, tags: string }) {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const userId = auth.currentUser.uid;

  try {
    // 1. Compress and encode to base64
    const url = await compressAndEncodeImage(data.file);

    // 2. Save to Firestore
    const batch = writeBatch(db);
    const photoRef = doc(collection(db, 'photos'));
    
    batch.set(photoRef, {
      url, // Base64 string
      title: data.title,
      description: data.description,
      albumId: data.albumId || '',
      ownerId: userId, // also userId as requested
      userId: userId, 
      createdAt: serverTimestamp(),
      isFavorite: false,
      tags: data.tags.split(',').map(t => t.trim()).filter(Boolean)
    });

    // 3. Update album count if applicable
    if (data.albumId) {
      const albumRef = doc(db, 'albums', data.albumId);
      batch.update(albumRef, {
        photoCount: increment(1),
        coverPhotoUrl: url // set as latest cover
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'photos');
  }
}

export async function createAlbum(title: string, description: string) {
  if (!auth.currentUser) throw new Error('User not authenticated');

  try {
    await addDoc(collection(db, 'albums'), {
      title,
      description,
      ownerId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      photoCount: 0,
      coverPhotoUrl: ''
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'albums');
  }
}

export async function togglePhotoFavorite(photoId: string, isFavorite: boolean) {
  try {
    const photoRef = doc(db, 'photos', photoId);
    await updateDoc(photoRef, { isFavorite: !isFavorite });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `photos/${photoId}`);
  }
}

export async function deletePhoto(photoId: string, albumId?: string) {
  try {
    const batch = writeBatch(db);
    
    // 1. Delete from Firestore
    batch.delete(doc(db, 'photos', photoId));

    // 2. Update album if applicable
    if (albumId) {
      batch.update(doc(db, 'albums', albumId), {
        photoCount: increment(-1)
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `photos/${photoId}`);
  }
}
