// IndexedDB wrapper for storing images
const DB_NAME = 'QusMakerDB';
const DB_VERSION = 1;
const IMAGES_STORE = 'images';

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        db.createObjectStore(IMAGES_STORE);
      }
    };
  });
};

// Save image to IndexedDB
export const saveImage = async (imageId, imageData) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([IMAGES_STORE], 'readwrite');
    const store = transaction.objectStore(IMAGES_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.put(imageData, imageId);
      request.onsuccess = () => resolve(imageId);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save image:', error);
    throw error;
  }
};

// Get image from IndexedDB
export const getImage = async (imageId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([IMAGES_STORE], 'readonly');
    const store = transaction.objectStore(IMAGES_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(imageId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get image:', error);
    return null;
  }
};

// Delete image from IndexedDB
export const deleteImage = async (imageId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([IMAGES_STORE], 'readwrite');
    const store = transaction.objectStore(IMAGES_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(imageId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
};

// Get all images for loading
export const getAllImages = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([IMAGES_STORE], 'readonly');
    const store = transaction.objectStore(IMAGES_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = async () => {
        const keys = request.result;
        const images = {};
        
        for (const key of keys) {
          const imageData = await getImage(key);
          if (imageData) {
            images[key] = imageData;
          }
        }
        
        resolve(images);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get all images:', error);
    return {};
  }
};
