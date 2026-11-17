/**
 * Capa mínima sobre IndexedDB, sin dependencias externas.
 *
 * La apertura de la base se memoiza y se invalida si otra pestaña/versión
 * necesita actualizarla. Cualquier error se propaga para que la interfaz pueda
 * mostrar un estado amable en lugar de romperse.
 */

export const DB_NAME = 'aprende-y-traza';
export const DB_VERSION = 1;

export type StoreName = 'progress' | 'settings';

let databasePromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no está disponible en este navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('progress')) {
        database.createObjectStore('progress', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      resolve(database);
    };

    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error('No se pudo abrir la base de datos local.'));
    };

    request.onblocked = () => {
      databasePromise = null;
      reject(new Error('La base de datos local está bloqueada por otra pestaña.'));
    };
  });

  return databasePromise;
}

export async function getRecord<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const database = await openDatabase();

  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).get(key);

    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error ?? new Error('No se pudo leer el progreso.'));
  });
}

export async function getAllRecords<T>(storeName: StoreName): Promise<T[]> {
  const database = await openDatabase();

  return new Promise<T[]>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error ?? new Error('No se pudieron leer los datos.'));
  });
}

export async function putRecord<T>(storeName: StoreName, value: T): Promise<void> {
  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put(value);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('No se pudo guardar el progreso.'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Se canceló el guardado del progreso.'));
  });
}

export async function deleteRecord(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).delete(key);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('No se pudieron borrar los datos.'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Se canceló el borrado de datos.'));
  });
}

export async function closeDatabase(): Promise<void> {
  const pending = databasePromise;
  databasePromise = null;
  if (!pending) {
    return;
  }

  try {
    const database = await pending;
    database.close();
  } catch {
    // Si la apertura falló, no hay nada que cerrar.
  }
}
