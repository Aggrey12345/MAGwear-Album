import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Album, Photo } from '../types';

export function useAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'albums'),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
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

    let q = query(
      collection(db, 'photos'),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    if (albumId === 'favorites') {
      q = query(
        collection(db, 'photos'),
        where('ownerId', '==', auth.currentUser.uid),
        where('isFavorite', '==', true),
        orderBy('createdAt', 'desc')
      );
    } else if (albumId) {
      q = query(
        collection(db, 'photos'),
        where('ownerId', '==', auth.currentUser.uid),
        where('albumId', '==', albumId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
      setPhotos(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'photos');
    });

    return () => unsubscribe();
  }, [auth.currentUser, albumId]);

  return { photos, loading };
}

export async function uploadPhoto(data: { file: File, title: string, description: string, albumId: string, tags: string }) {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const userId = auth.currentUser.uid;
  const photoId = Math.random().toString(36).substr(2, 9);
  const storageRef = ref(storage, `photos/${userId}/${photoId}_${data.file.name}`);

  try {
    // 1. Upload to Storage
    const snapshot = await uploadBytes(storageRef, data.file);
    const url = await getDownloadURL(snapshot.ref);

    // 2. Save to Firestore
    const batch = writeBatch(db);
    const photoRef = doc(collection(db, 'photos'));
    
    batch.set(photoRef, {
      url,
      title: data.title,
      description: data.description,
      albumId: data.albumId || '',
      ownerId: userId,
      createdAt: serverTimestamp(),
      isFavorite: false,
      tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
      storagePath: snapshot.ref.fullPath
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

export async function deletePhoto(photoId: string, storagePath?: string, albumId?: string) {
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

    // 3. Delete from Storage (best effort)
    if (storagePath) {
      const sRef = ref(storage, storagePath);
      await deleteObject(sRef);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `photos/${photoId}`);
  }
}
