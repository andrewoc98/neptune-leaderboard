// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {collection, getDocs, getFirestore} from "firebase/firestore";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import {v4 as uuidv4} from 'uuid';


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBkTf6uc17dsoLjnFjqqsopDMx7vzckuwQ",
    authDomain: "neptune-mens-leaderboard.firebaseapp.com",
    databaseURL: "https://neptune-mens-leaderboard-default-rtdb.firebaseio.com",
    projectId: "neptune-mens-leaderboard",
    storageBucket: "neptune-mens-leaderboard.firebasestorage.app",
    messagingSenderId: "832205213701",
    appId: "1:832205213701:web:669dc49f9bfa3a08218c6c",
    measurementId: "G-W09Y34YN8E"
};

const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);

export const approveSession = async (entry) => {
    try {
        const entryRef = doc(database, "sessionHistory", entry.id.toString());
        await setDoc(entryRef, { ...entry, approved: true });
        console.log(`Entry ${entry.id} approved and saved to Firebase`);
        return true;
    } catch (err) {
        console.error("Error approving entry:", err);
        return false;
    }
};

/**
 * Rejects a session entry and deletes it from Firebase
 * @param {Object} entry - The session entry object
 */
export const rejectSession = async (entry) => {
    try {
        const entryRef = doc(database, "sessions", entry.id.toString());
        await deleteDoc(entryRef);
        console.log(`Entry ${entry.id} rejected and deleted from Firebase`);
        return true;
    } catch (err) {
        console.error("Error rejecting entry:", err);
        return false;
    }
};

export const rowerSession = async (entry) => {
    try {
        if(!entry.id){
            entry.id = uuidv4()
        }
        const entryRef = doc(database, "sessionHistory", entry.id.toString());
        await setDoc(entryRef, { ...entry, approved: false });
        console.log(`Entry ${entry.id} approved and saved to Firebase`);
        return true;
    } catch (err) {
        console.error("Error approving entry:", err);
        return false;
    }
};

export const ergScores = async () =>{
    const result = [];
    const snapshot = await getDocs(collection(database, "ergScores"));

    snapshot.forEach(doc => {
        result.push({
            id: doc.id,
            ...doc.data()
        });

    });

    return result;

}

export const waterScores = async () =>{
    const result = [];
    const snapshot = await getDocs(collection(database, "waterScores"));

    snapshot.forEach(doc => {
        result.push({
            id: doc.id,
            ...doc.data()
        });

    });

    return result;

}

