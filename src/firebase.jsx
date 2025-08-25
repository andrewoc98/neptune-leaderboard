// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, arrayUnion  } from "firebase/firestore";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { getDoc, updateDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { getPreviousSunday, getISOWeek } from "./Util";


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
        if (!entry.id) {
            entry.id = uuidv4()
        }
        const entryRef = doc(database, "sessionHistory", entry.id.toString());
        await setDoc(entryRef, { ...entry, approved: false });
        console.log(`Entry ${entry.id} sent for approval`);
        return true;
    } catch (err) {
        console.error("Error approving entry:", err);
        return false;
    }
};

export const loadLeaderboardHistory = async () => {
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
    console.log(newEntry)
    if (!snap.exists()) throw new Error("Document not found");

    let entries = snap.data().entries || [];

    // Set the date to the previous Sunday using your function
    newEntry.date = getPreviousSunday(newEntry.date);

    const index = entries.findIndex(e => e.date === newEntry.date);

    if (index >= 0) {
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


export async function getErgWorkouts() {
    const ref = doc(database, "workouts", 'lIjuoJIC0awyIGLqQtYx');
    const snap = await getDoc(ref);

    if (!snap.exists()) throw new Error("Document not found");

    const today = new Date();
    const { year: currentYear, week: currentWeek } = getISOWeek(today);
    const currentWeekStr = `${currentYear}-W${String(currentWeek).padStart(2, '0')}`

    const nextWeekDate = new Date(today);
    nextWeekDate.setDate(today.getDate() + 7);
    const { year: nextYear, week: nextWeek } = getISOWeek(nextWeekDate);
    const nextWeekStr = `${nextYear}-W${String(nextWeek).padStart(2, '0')}`
    let results = {}
    snap.data().workouts.forEach((entry) => {
        if (entry.date === currentWeekStr) {
            results.currentWeek = entry.text
        } else if (entry.date === nextWeekStr) {
            results.nextWeek = entry.text
        }
    })
    if (!results.currentWeek) {
        results.currentWeek = 'TBD'
    }
    if (!results.nextWeek) {
        results.nextWeek = 'TBD'
    }
    return results

}

export async function getWaterWorkouts() {
    const ref = doc(database, "workouts", 'R1e1kBGvqEGyKRVYtbrn');
    const snap = await getDoc(ref);

    if (!snap.exists()) throw new Error("Document not found");

    const today = new Date();
    const { year: currentYear, week: currentWeek } = getISOWeek(today);
    const currentWeekStr = `${currentYear}-W${String(currentWeek).padStart(2, '0')}`

    const nextWeekDate = new Date(today);
    nextWeekDate.setDate(today.getDate() + 7);
    const { year: nextYear, week: nextWeek } = getISOWeek(nextWeekDate);
    const nextWeekStr = `${nextYear}-W${String(nextWeek).padStart(2, '0')}`
    let results = {}
    snap.data().workouts.forEach((entry) => {
        if (entry.date === currentWeekStr) {
            results.currentWeek = entry.text
        } else if (entry.date === nextWeekStr) {
            results.nextWeek = entry.text
        }
    })
    if (!results.currentWeek) {
        results.currentWeek = 'TBD'
    }
    if (!results.nextWeek) {
        results.nextWeek = 'TBD'
    }

    return results

}

export async function updateOrAppendWorkout(newEntry) {
    let refId = ''
    let workout = {}
    if (newEntry.type === 'Erg') {
        refId = 'lIjuoJIC0awyIGLqQtYx'
    } else if (newEntry.type === 'Water') {
        refId = 'R1e1kBGvqEGyKRVYtbrn'
    } else {
        console.error("Error in submitting workout");
        return
    }
    const ref = doc(database, "workouts", refId);

    try {
        const snapshot = await getDoc(ref);
        console.log(snapshot)
        if (!snapshot.exists()) {
            // If document doesn't exist, create it with initial array
            await updateDoc(ref, { entries: [newEntry] });
            return;
        }

        const data = snapshot.data();
        const entries = data.entries || [];

        // Check if an entry with the same date exists
        const index = entries.findIndex(entry => entry.date === newEntry.date);

        if (index !== -1) {
            // Update the existing entry
            entries[index] = newEntry;
            await updateDoc(ref, { entries });
        } else {
            // Append the new entry
            await updateDoc(ref, { workouts: arrayUnion(newEntry) });
        }

        console.log("Workout updated successfully!");
    } catch (error) {
        console.error("Error updating workout:", error);
    }
}

export async function addQuote(newQuote) {
  try {
    const ref = doc(database, "quotes", "hHwBYh833CPbxMBvwdZt");

    // Add the new quote to the 'quotes' array
    await updateDoc(ref, {
      quotes: arrayUnion(newQuote)
    });

    console.log("Quote added successfully!");
  } catch (error) {
    console.error("Error adding quote: ", error);
  }
}

export async function getQuote() {
  try {
    const ref = doc(database, "quotes", "hHwBYh833CPbxMBvwdZt");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.warn("No such document!");
      return [];
    }

    const quotes = snap.data().quotes || [];
    // Only return quotes where approved === true
    return quotes.filter(q => q.approved === true);
  } catch (error) {
    console.error("Error fetching quotes: ", error);
    return [];
  }
}

function getMultipliersDocRef() {
    return doc(database, "mulipliers", "types");
}

// 🔹 Fetch multipliers
export async function getMultipliers() {
    const snapshot = await getDoc(getMultipliersDocRef());
    console.log(snapshot.data() )
    return snapshot.exists() ? snapshot.data() : {};
}

// 🔹 Update multipliers
export async function updateMultipliers(newData) {
    await setDoc(getMultipliersDocRef(), newData, { merge: true });
}


