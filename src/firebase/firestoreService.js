import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  limit
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// Helper untuk menambahkan timestamp
const addTimestamps = (data) => ({
  ...data,
  updated_at: serverTimestamp()
});

// Collection references
export const collections = {
  schools: () => collection(db, "schools"),
  users: () => collection(db, "users"),
  classes: () => collection(db, "classes"),
  subjects: () => collection(db, "subjects"),
  schedules: () => collection(db, "schedules"),
  attendance: () => collection(db, "attendance"),
  grades: () => collection(db, "grades"),
  payments: () => collection(db, "payments"),
  announcements: () => collection(db, "announcements")
};

// CRUD Operations
export const firestoreService = {
  // Create or Update document
  createOrUpdateDocument: async (collectionName, id, data, isUpdate = false) => {
    try {
      const docRef = doc(db, collectionName, id);
      
      if (isUpdate) {
        // Check if document exists before updating
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          // Create new document if doesn't exist
          const dataWithTimestamp = {
            ...data,
            ...addTimestamps(data),
            created_at: serverTimestamp()
          };
          await setDoc(docRef, dataWithTimestamp);
          return { success: true, id: docRef.id, created: true };
        } else {
          // Update existing document
          await updateDoc(docRef, addTimestamps(data));
          return { success: true, id: docRef.id, updated: true };
        }
      } else {
        // Create new document
        const dataWithTimestamp = {
          ...data,
          ...addTimestamps(data),
          created_at: serverTimestamp()
        };
        await setDoc(docRef, dataWithTimestamp);
        return { success: true, id: docRef.id, created: true };
      }
    } catch (error) {
      console.error(`Error in createOrUpdateDocument (${collectionName}/${id}):`, error);
      return { success: false, error: error.message };
    }
  },

  // Create
  createDocument: async (collectionName, id, data) => {
    try {
      const docRef = doc(db, collectionName, id);
      const dataWithTimestamp = {
        ...data,
        ...addTimestamps(data),
        created_at: serverTimestamp()
      };
      await setDoc(docRef, dataWithTimestamp);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Read
  getDocument: async (collectionName, id) => {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert Firestore timestamps to Date objects
        const result = { id: docSnap.id };
        for (const key in data) {
          if (data[key] && typeof data[key].toDate === 'function') {
            result[key] = data[key].toDate();
          } else {
            result[key] = data[key];
          }
        }
        return result;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      return null;
    }
  },

  // Update
  updateDocument: async (collectionName, id, data) => {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        // Document doesn't exist, create it instead
        return await firestoreService.createDocument(collectionName, id, data);
      }
      await updateDoc(docRef, addTimestamps(data));
      return { success: true };
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Delete
  deleteDocument: async (collectionName, id) => {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Query with filters
  queryDocuments: async (collectionName, filters = [], orderByField = null, orderDirection = 'asc', limitCount = null) => {
    try {
      let q = collection(db, collectionName);
      
      // Build query
      if (filters && filters.length > 0) {
        filters.forEach(filter => {
          if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
            q = query(q, where(filter.field, filter.operator, filter.value));
          }
        });
      }
      
      // Apply ordering
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection));
      }
      
      // Apply limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore timestamps to Date objects
        const item = { id: doc.id };
        for (const key in data) {
          if (data[key] && typeof data[key].toDate === 'function') {
            item[key] = data[key].toDate();
          } else {
            item[key] = data[key];
          }
        }
        results.push(item);
      });
      return results;
    } catch (error) {
      console.error(`Error querying documents from ${collectionName}:`, error);
      return [];
    }
  },

  // Real-time listener
  listenToCollection: (collectionName, filters = [], callback, errorCallback) => {
    try {
      let q = collection(db, collectionName);
      
      if (filters && filters.length > 0) {
        filters.forEach(filter => {
          if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
            q = query(q, where(filter.field, filter.operator, filter.value));
          }
        });
      }
      
      return onSnapshot(q, 
        (snapshot) => {
          const data = [];
          snapshot.forEach((doc) => {
            const docData = doc.data();
            const item = { id: doc.id };
            for (const key in docData) {
              if (docData[key] && typeof docData[key].toDate === 'function') {
                item[key] = docData[key].toDate();
              } else {
                item[key] = docData[key];
              }
            }
            data.push(item);
          });
          callback(data);
        },
        (error) => {
          console.error(`Error listening to collection ${collectionName}:`, error);
          if (errorCallback) errorCallback(error);
        }
      );
    } catch (error) {
      console.error(`Error setting up listener for ${collectionName}:`, error);
      return () => {}; // Return empty unsubscribe function
    }
  },

  // Batch operations dengan validasi yang benar
  batchUpdate: async (operations) => {
    try {
      const batch = writeBatch(db);
      
      // Validate operations before committing
      const validatedOperations = [];
      
      for (const op of operations) {
        if (op.type === 'update') {
          const docRef = doc(db, op.collection, op.id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            batch.update(docRef, addTimestamps(op.data));
            validatedOperations.push(op);
          } else {
            // Jika dokumen tidak ada, gunakan set dengan merge
            batch.set(docRef, {
              ...op.data,
              ...addTimestamps(op.data),
              created_at: serverTimestamp()
            }, { merge: true });
            validatedOperations.push({ ...op, type: 'set' });
          }
        } else if (op.type === 'set') {
          const docRef = doc(db, op.collection, op.id);
          batch.set(docRef, {
            ...op.data,
            ...addTimestamps(op.data),
            created_at: serverTimestamp()
          });
          validatedOperations.push(op);
        } else if (op.type === 'delete') {
          const docRef = doc(db, op.collection, op.id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            batch.delete(docRef);
            validatedOperations.push(op);
          } else {
            console.warn(`Cannot delete non-existent document: ${op.collection}/${op.id}`);
          }
        }
      }
      
      if (validatedOperations.length === 0) {
        console.warn('No valid operations to commit');
        return { success: true, message: 'No valid operations to commit' };
      }
      
      await batch.commit();
      console.log(`Batch commit successful: ${validatedOperations.length} operations`);
      return { 
        success: true, 
        operationsCount: validatedOperations.length,
        operations: validatedOperations 
      };
    } catch (error) {
      console.error('Error in batch update:', error);
      return { 
        success: false, 
        error: error.message,
        code: error.code 
      };
    }
  },

  // Simple batch for attendance (tanpa validasi dokumen)
  simpleBatchUpdate: async (operations) => {
    try {
      const batch = writeBatch(db);
      
      operations.forEach(op => {
        if (op.type === 'set') {
          const docRef = doc(db, op.collection, op.id);
          batch.set(docRef, {
            ...op.data,
            updated_at: serverTimestamp(),
            created_at: op.data.created_at || serverTimestamp()
          });
        } else if (op.type === 'update') {
          const docRef = doc(db, op.collection, op.id);
          batch.update(docRef, {
            ...op.data,
            updated_at: serverTimestamp()
          });
        }
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error in simple batch update:', error);
      return { success: false, error: error.message };
    }
  }
};