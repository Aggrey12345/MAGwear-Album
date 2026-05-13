/**
 * Utility for compressing and converting images to base64 for Firestore storage.
 * Enforces the 1MB document limit.
 */
export async function compressAndEncodeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      // Firestore document limit is 1,048,576 bytes. 
      // We aim for slightly less to account for other fields.
      const LIMIT = 1048487;

      if (base64.length <= LIMIT) {
        return resolve(base64);
      }

      // If too large, compress using canvas
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if dimensions are too large (max 1600px)
        const MAX_DIM = 1600;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          } else {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        
        ctx.drawImage(img, 0, 0, width, height);

        // Iterative compression
        let quality = 0.9;
        let compressedBase64 = canvas.toDataURL('image/jpeg', quality);

        while (compressedBase64.length > LIMIT && quality > 0.1) {
          quality -= 0.1;
          compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        }

        if (compressedBase64.length > LIMIT) {
          reject(new Error('Image is too large even after compression. Use a smaller image.'));
        } else {
          resolve(compressedBase64);
        }
      };
      img.onerror = () => reject(new Error('Image loading failed'));
    };
    reader.onerror = () => reject(new Error('File reading failed'));
  });
}
