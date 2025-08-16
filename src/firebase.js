// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {collection, getDocs, getFirestore} from "firebase/firestore";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { getDoc, updateDoc } from "firebase/firestore";
import {v4 as uuidv4} from 'uuid';
import {getPreviousSunday} from "./Util";


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
        const entryRef = doc(database, "sessionHistory", entry.id.toString());
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

export const loadLeaderboardHistory = async () =>{
    const result = [];
    const snapshot = await getDocs(collection(database, "leaderboardHistory"));

    snapshot.forEach(doc => {
        result.push({
            id: doc.id,
            ...doc.data()
        });

    });

    return result[0].entries

}

export async function saveLeaderBoardtoDB(newEntry) {
    const ref = doc(database, "leaderboardHistory", '7ybV6j8crv0G67snO4Io');
    const snap = await getDoc(ref);

    if (!snap.exists()) throw new Error("Document not found");

    let entries = snap.data().entries || [];
    const index = entries.findIndex(e => e.date === newEntry.date);

    if (index >= 0) {
        // Update only provided fields
        if (newEntry.ergData !== undefined) entries[index].ergData = newEntry.ergData;
        if (newEntry.waterData !== undefined) entries[index].waterData = newEntry.waterData;
    } else {
        entries.push({
            date: newEntry.date,
            ergData: newEntry.ergData ?? [],
            waterData: newEntry.waterData ?? []
        });
    }

    await updateDoc(ref, { entries });
}



