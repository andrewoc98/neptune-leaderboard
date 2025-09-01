// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, arrayUnion  } from "firebase/firestore";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { getDoc, updateDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { getPreviousSunday, getISOWeek } from "./Util";
import axios from "axios";


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

export async function saveLeaderBoardtoDB(newEntry) {
    const ref = doc(database, "page-data", 'leaderboards');
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

export function getWorkouts(workout) {
    const today = new Date();

    // helper to get ISO week string
    function getISOWeekString(date) {
        const tmp = new Date(date.getTime());
        // Thursday in current week decides the year
        tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
        const yearStart = new Date(tmp.getFullYear(), 0, 1);
        const week = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
        return `${tmp.getFullYear()}-W${String(week).padStart(2, "0")}`;
    }

    const currentWeekStr = getISOWeekString(today);
    const nextWeekStr = getISOWeekString(new Date(today.setDate(today.getDate() + 7)));

    // helper for both erg & water
    function extractWorkouts(entries) {
        let res = {};
        if(entries){
        entries.forEach((entry) => {
            if (entry.week === currentWeekStr) {
                res.currentWeek = entry.workout;
            } else if (entry.week === nextWeekStr) {
                res.nextWeek = entry.workout;
            }
        });
        }
        if (!res.currentWeek) res.currentWeek = "TBD";
        if (!res.nextWeek) res.nextWeek = "TBD";
        return res;
    }
    return {
        water: extractWorkouts(workout.water),
        erg: extractWorkouts(workout.erg),
    }

}

export async function updateOrAppendWorkout(newEntry) {
    let refId = ''

    if (newEntry.type === 'Erg') {
        refId = 'erg'
    } else if (newEntry.type === 'Water') {
        refId = 'water'
    } else {
        console.error("Error in submitting workout");
        return
    }
    const ref = doc(database, "page-data", 'workouts');

    try {
        const snapshot = await getDoc(ref);
        if (!snapshot.exists()) {
            // If document doesn't exist, create it with initial array
            await updateDoc(ref, { entries: [newEntry] });
            return;
        }

        const data = snapshot.data();
        const entries = data[refId] || [];

        // Check if an entry with the same date exists
        const index = entries.findIndex(entry => entry.date === newEntry.date);

        if (index !== -1) {
            // Update the existing entry
            entries[index] = newEntry;
            await updateDoc(ref, {[refId]:{ entries }});
        } else {
            // Append the new entry
            await updateDoc(ref, { [refId]: arrayUnion(newEntry) });
        }

        console.log("Workout updated successfully!");
    } catch (error) {
        console.error("Error updating workout:", error);
    }
}

export async function addQuote(newQuote) {
  try {
    const ref = doc(database, "page-data", "quotes");

    // Add the new quote to the 'quotes' array
    await updateDoc(ref, {
      quotes: arrayUnion(newQuote)
    });

    console.log("Quote added successfully!");
  } catch (error) {
    console.error("Error adding quote: ", error);
  }
}


function getMultipliersDocRef() {
    return doc(database, "page-data", "multipliers");
}

// 🔹 Fetch multipliers
export async function getMultipliers() {
    const snapshot = await getDoc(getMultipliersDocRef());
    return snapshot.exists() ? snapshot.data() : {};
}

// 🔹 Update multipliers
export async function updateMultipliers(newData) {
    await setDoc(getMultipliersDocRef(), newData, { merge: true });
}

function getUsersDocRef(){
    return doc(database, "page-data","users")
}

export async function getUsers(){
    const snapshot = await getDoc(getUsersDocRef())
    return snapshot.exists() ? snapshot.data() : {}
}

export async function  updateUsers(newData){
    await setDoc(getUsersDocRef(), newData, {merge: true})
}



/**
 * Loads all documents from a given Firestore collection
 * @param {string} collectionName - The name of the collection to fetch
 * @returns {Promise<Array<Object>>} - Array of document data with IDs included
 */
export async function loadAllDocuments() {
    const colRef = collection(database, "page-data");
    const snapshot = await getDocs(colRef);

   return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Saves Strava athlete + token info into Firestore
 * @param {Object} data - Strava auth response (from /oauth/token)
 */
export async function saveStravaUser(data) {
    try {
        const { access_token, refresh_token, expires_at, athlete } = data;

        const userDoc = {
            athlete_id: athlete.id,
            firstname: athlete.firstname,
            lastname: athlete.lastname,
            profile: athlete.profile,
            access_token,
            refresh_token,
            expires_at,
            updated_at: new Date().toISOString(),
        };

        const entryRef = doc(database, "strava", String(athlete.id));
        await setDoc(entryRef, userDoc, { merge: true });

        console.log(`✅ Saved/updated Strava user ${athlete.id}`);
        return true;
    } catch (err) {
        console.error("❌ Error saving Strava user:", err);
        return false;
    }

}

/**
 * Fetches Strava activities since the last epoch in Firestore and updates epoch
 * @param {string} athleteId - Strava athlete ID
 */
/**
 * Fetch all Strava activities for all athletes since the last stored epoch
 * @returns {Array} Array of activity objects with athlete info
 */
export async function fetchAllAthleteActivities() {
    try {
        // 1. Get last epoch
        const epochRef = doc(database, "page-data", "strava");
        const epochSnap = await getDoc(epochRef);
        const lastEpoch = epochSnap.exists() && epochSnap.data().epoch ? epochSnap.data().epoch : 0;
        const nowEpoch = Math.floor(Date.now() / 1000);
        console.log(lastEpoch)
        console.log(nowEpoch)
        // 2. Load all athletes
        const athletesRef = collection(database, "strava");
        const athletesSnapshot = await getDocs(athletesRef);
        const allActivities = [];

        for (const athleteDoc of athletesSnapshot.docs) {
            const athleteData = athleteDoc.data();
            let { access_token, refresh_token, expires_at, athlete } = athleteData;

            // 3. Refresh token if expired
            if (Date.now() / 1000 > expires_at) {
                const refreshRes = await axios.post("https://www.strava.com/oauth/token", {
                    client_id: process.env.STRAVA_CLIENT_ID,
                    client_secret: process.env.STRAVA_CLIENT_SECRET,
                    grant_type: "refresh_token",
                    refresh_token,
                });

                access_token = refreshRes.data.access_token;
                refresh_token = refreshRes.data.refresh_token;
                expires_at = refreshRes.data.expires_at;

                const athleteRef = doc(database, "strava", athleteDoc.id);
                await updateDoc(athleteRef, {
                    access_token,
                    refresh_token,
                    expires_at,
                    updated_at: new Date(), // v9 SDK — no admin.firestore.FieldValue
                });
            }

            // 4. Fetch activities in pages
            let page = 1;
            while (true) {
                const res = await axios.get("https://www.strava.com/api/v3/athlete/activities", {
                    headers: { Authorization: `Bearer ${access_token}` },
                    params: { after: lastEpoch, before: nowEpoch, per_page: 200, page },
                });

                if (!res.data || res.data.length === 0) break;

                // Add athlete info to each activity
                const activitiesWithAthlete = res.data.map(act => ({
                    ...act,
                    athlete: {
                        id: athlete.id,
                        firstname: athlete.firstname,
                        lastname: athlete.lastname,
                        profile: athlete.profile,
                    },
                }));

                allActivities.push(...activitiesWithAthlete);
                page++;
            }
        }

        // 5. Update global epoch
        await setDoc(epochRef, { epoch: nowEpoch }, { merge: true });

        console.log(allActivities);
        return allActivities;
    } catch (err) {
        console.error("Error fetching all athletes' activities:", err.response?.data || err.message);
        throw err;
    }
}





