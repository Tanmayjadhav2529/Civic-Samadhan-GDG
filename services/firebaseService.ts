
// Use modular Firebase SDK syntax
import { initializeApp } from "firebase/app";
// Splitting firestore imports to improve compatibility with certain module resolvers
import { getFirestore } from "firebase/firestore";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { CivicReport } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyC3QZRVuDmIVtXSBS6ipOMORQ-QFw8hQWM",
  authDomain: "code4civic.firebaseapp.com",
  projectId: "code4civic",
  storageBucket: "code4civic.firebasestorage.app",
  messagingSenderId: "675882830899",
  appId: "1:675882830899:web:3a6699697d61aefa566746"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const REPORTS_COLLECTION = "reports";

/**
 * Subscribes to the reports collection using real-time snapshots.
 * Maps document data to CivicReport, ensuring Firestore metadata is handled.
 */
export const subscribeToReports = (callback: (reports: CivicReport[]) => void) => {
  const q = query(collection(db, REPORTS_COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        // We ensure the ID is mapped correctly; firebaseId is added for document updates
        firebaseId: d.id,
        id: data.id || d.id
      } as unknown as CivicReport;
    });
    callback(reports);
  }, (error) => {
    console.error("Firestore Subscription Error (Check Rules):", error.message);
    if (error.code === 'permission-denied') {
      console.warn("ACTION REQUIRED: Set Firestore rules to 'allow read, write: if true;' in Firebase Console.");
    }
  });
};

/**
 * Adds a report object to the Firestore collection.
 */
export const addReportToFirebase = async (report: CivicReport) => {
  try {
    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), report);
    return docRef.id;
  } catch (e: any) {
    console.error("Error adding document (Check Rules):", e.message);
    throw e;
  }
};

/**
 * Updates an existing report document using the specific Firestore document ID.
 */
export const updateReportInFirebase = async (firebaseId: string, updates: Partial<CivicReport>) => {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, firebaseId);
    await updateDoc(docRef, updates);
  } catch (e: any) {
    console.error("Error updating document (Check Rules):", e.message);
    throw e;
  }
};
