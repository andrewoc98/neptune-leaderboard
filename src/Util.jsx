import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import {database, getMultipliers} from "./firebase";
import { TbFishBone, TbFish } from 'react-icons/tb';
import { GiPorcupinefish, GiSharkJaws, GiDolphin, GiSpermWhale, GiAnglerFish, GiTropicalFish, GiSnakeTongue, GiSadCrab, GiTadpole } from 'react-icons/gi';
import './App.css';

export function adjustedErgScore(split, weight) {
    const [minutesStr, secTenthsStr] = split.split(":");

    const minutes = parseInt(minutesStr, 10);
    const seconds = parseFloat(secTenthsStr);
    const totalSeconds = minutes * 60 + seconds;
    const factor = Math.pow(weight / 122.47, 1 / 9);

    const adjustedSeconds = (factor * totalSeconds).toFixed(1);

    const mins = Math.floor(adjustedSeconds / 60);
    const secs = (adjustedSeconds % 60).toFixed(1);

    // Pad seconds so "0.0" -> "00.0"
    const formattedSecs = secs < 10 ? "0" + secs : secs;

    return `${mins}:${formattedSecs}`;
}


export function goldMedalPercentage(time, boatClass, distance, gmpSpeeds) {
    const [minutesStr, secTenthsStr] = time.split(':');
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseFloat(secTenthsStr);
    const totalSeconds = minutes * 60 + seconds;
    const gmpSpeed = gmpSpeeds[boatClass.toLowerCase()];
    if (gmpSpeed === undefined) return NaN;

    return (distance / totalSeconds) / gmpSpeed * 100;
}

const rankThreshold = {
  0: <TbFishBone size={20} />,
  350000: <GiTadpole size={20} />,
  700000: <TbFish size={20} />,
  1050000: <GiTropicalFish size={20} />,
  1400000: <GiSadCrab size={20} />,
  1750000: <GiPorcupinefish size={20} />,
  2100000: <GiAnglerFish size={20} />,
  2450000: <GiDolphin size={20} />,
  2800000: <GiSpermWhale size={22} />,
  3150000: <GiSharkJaws size={20} />,
  3500000: <GiSnakeTongue size={20} />,
  3850000: <GiTadpole size={20} className="gold-fill" />,
  4200000: <TbFish size={20} className="gold-fill" />,
  4550000: <GiTropicalFish size={20} className="gold-fill" />,
  4900000: <GiSadCrab size={20} className="gold-fill" />,
  5250000: <GiPorcupinefish size={20} className="gold-fill" />,
  5600000: <GiAnglerFish size={20} className="gold-fill" />,
  5950000: <GiDolphin size={20} className="gold-fill" />,
  6300000: <GiSpermWhale size={22} className="gold-fill" />,
  6650000: <GiSharkJaws size={20} className="gold-fill" />,
  7000000: <GiSnakeTongue size={20} className="gold-fill" />
};

export function getRankIcon(value) {
    // Get sorted numeric keys
    const thresholds = Object.keys(rankThreshold)
        .map(Number)
        .sort((a, b) => a - b);

    // Loop and find the highest threshold that is less than or equal to value
    let result = null;
    for (let threshold of thresholds) {
        if (value >= threshold) {
            result = rankThreshold[threshold];
        } else {
            break;
        }
    }

    // Return the matched icon, or null if value is below all thresholds
    return result;
}

export async function getAllSessionHistory() {
    const result = [];
    const snapshot = await getDocs(collection(database, "sessionHistory"));

    snapshot.forEach(doc => {
        result.push({
            id: doc.id,
            ...doc.data()
        });

    });

    return result;
}

export function formatDate(date) {
    const [year, month, day] = date.split('/');
    return `${day}/${month}/${year}`;
}


function parseFirestoreDate(d) {
    if (!d) return null;

    // Firestore Timestamp
    if (d.seconds !== undefined && d.nanoseconds !== undefined) {
        return new Date(d.seconds * 1000 + Math.floor(d.nanoseconds / 1e6));
    }

    // JS Date
    if (d instanceof Date) return d;

    // String
    if (typeof d === "string") {
        const parsed = new Date(d);
        return isNaN(parsed) ? null : parsed;
    }

    return null;
}

export function getSessionStats(period, distanceMultiplier, allSessions) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let startDate;
    if (period === "month") {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
    } else {
        startDate = new Date(-8640000000000000);
    }

    const stats = {};

    allSessions.forEach(entry => {
        if (!entry.approved) return;

        const entryDate = parseFirestoreDate(entry.date);
        if (!entryDate) return;
        entryDate.setHours(0, 0, 0, 0);

        if (entryDate >= startDate && entryDate <= today) {
            const { name, distance, intense, weights, type } = entry;
            if (!stats[name]) {
                stats[name] = { name, totalDistance: 0, totalSessions: 0, steadyCount: 0, intensityCount: 0, weightsCount: 0 };
            }
            stats[name].totalDistance += Number(distance) * distanceMultiplier[type];
            stats[name].totalSessions += 1;
            if (intense) stats[name].intensityCount += 1;
            else if (weights) stats[name].weightsCount += 1;
            else stats[name].steadyCount += 1;
        }
    });

    return Object.values(stats).sort((a, b) => b.totalDistance - a.totalDistance);
}

export function getDistanceForLastPeriod(period, allSessions, distanceMultiplier) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let currentStart, previousStart, previousEnd;

    if (period === "month") {
        currentStart = new Date(today);
        currentStart.setDate(today.getDate() - 29); // last 30 days
        currentStart.setHours(0, 0, 0, 0);

        previousStart = new Date(today);
        previousStart.setDate(today.getDate() - 59); // 60 days ago
        previousStart.setHours(0, 0, 0, 0);

        previousEnd = new Date(today);
        previousEnd.setDate(today.getDate() - 30); // 30 days ago
        previousEnd.setHours(23, 59, 59, 999);
    } else if (period === "week") {
        currentStart = new Date(today);
        currentStart.setDate(today.getDate() - 6); // last 7 days
        currentStart.setHours(0, 0, 0, 0);

        previousStart = new Date(today);
        previousStart.setDate(today.getDate() - 13); // 14 days ago
        previousStart.setHours(0, 0, 0, 0);

        previousEnd = new Date(today);
        previousEnd.setDate(today.getDate() - 7); // 7 days ago
        previousEnd.setHours(23, 59, 59, 999);
    } else {
        return {}; // no change for season
    }

    const distanceByRower = {};
    const prevDistanceByRower = {};

    allSessions.forEach(session => {
        if (!session.approved) return;

        const entryDate = parseFirestoreDate(session.date);
        if (!entryDate) return;
        entryDate.setHours(0, 0, 0, 0);

        const { name, distance, type } = session;
        const multiplier = distanceMultiplier[type] || 1;

        if (entryDate >= currentStart && entryDate <= today) {
            distanceByRower[name] = (distanceByRower[name] || 0) + Number(distance) * multiplier;
        } else if (entryDate >= previousStart && entryDate <= previousEnd) {
            prevDistanceByRower[name] = (prevDistanceByRower[name] || 0) + Number(distance) * multiplier;
        }
    });

    // return delta between current and previous period
    const changeByRower = {};
    const allNames = new Set([...Object.keys(distanceByRower), ...Object.keys(prevDistanceByRower)]);
    allNames.forEach(name => {
        changeByRower[name] = (distanceByRower[name] || 0) - (prevDistanceByRower[name] || 0);
    });

    return changeByRower;
}



export function listenToUnApprovedSessions(callback) {
    const q = query(
        collection(database, "sessionHistory"), 
    );

    // Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const sessions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(sessions);
    });

    return unsubscribe; // so you can clean up in useEffect
}

export function getPreviousSunday(dateStr) {
    const [day, month, year] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    const dayOfWeek = date.getDay();

    date.setDate(date.getDate() - dayOfWeek);

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

export function upsertEntry(entries, newEntry) {
    const { date, ergData, waterData } = newEntry;

    // Find if an entry with the same date already exists
    const existing = entries.find(entry => entry.date === date);

    if (existing) {
        // Update only the provided fields
        if (ergData !== undefined) existing.ergData = ergData;
        if (waterData !== undefined) existing.waterData = waterData;
    } else {
        // Add a new entry (keeping missing field as null or undefined)
        entries.push({
            date,
            ergData: ergData ?? null,
            waterData: waterData ?? null
        });
    }

    return entries;
}

export function getISOWeek(date) {
    const tempDate = new Date(date.getTime());
    // Set to Thursday in current week to calculate ISO week number
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - (tempDate.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
    return { year: tempDate.getUTCFullYear(), week: weekNo };
}


export function sortByDate(data) {
    return data.sort((a, b) => {
        if (!a.date) return 1; // push items without a date to the end
        if (!b.date) return -1;

        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);

        return dateB - dateA; // descending
    });
}

export function selectIndividuals(data, users, numIndividuals, maxAveragePoints, type, gmpSpeeds) {
    if(!maxAveragePoints || !data){
        return [0,[]]
    }
    try {
        const waterData = data.waterData || [];
        if (numIndividuals <= 0 || waterData.length === 0) return [0,[]];

        // Merge goldMedalPercentage with selected points type
        const merged = waterData.map(d => {
            const user = users[d.name];
            if (!user) return null;
            if(user.champs){
            if (type === "scull") {
                if (user.scull === undefined) return null;
                return {
                    name: d.name,
                    goldMedalPercentage: Number(goldMedalPercentage(d.time, d.boatClass, d.distance, gmpSpeeds)),
                    points: user.scull
                };
            } else if (type === "sweep") {
                if (!user.sweep || user.sweep.points === undefined) return null;
                return {
                    name: d.name,
                    goldMedalPercentage: Number(goldMedalPercentage(d.time, d.boatClass, d.distance, gmpSpeeds)),
                    points: user.sweep.points,
                    side: user.sweep.side // Bow, Stroke, or Both
                };
            }}

            return null;
        }).filter(Boolean);

        if (merged.length < numIndividuals) return [];

        let bestGroup = [];
        let bestGoldAvg = -1;

        function isValidSweepGroup(group) {
            let bow = 0, stroke = 0, both = 0;
            for (const person of group) {
                if (person.side === "Bow") bow++;
                else if (person.side === "Stroke") stroke++;
                else if (person.side === "Both") both++;
            }

            // After assigning "Both" optimally, bow == stroke must hold
            const diff = Math.abs(bow - stroke);
            return both >= diff && (bow + stroke + both) % 2 === 0;
        }

        function combine(arr, k, start = 0, path = []) {
            if (path.length === k) {
                const avgPoints = path.reduce((sum, ind) => sum + ind.points, 0) / k;
                if (avgPoints <= maxAveragePoints) {
                    if (type === "sweep" && !isValidSweepGroup(path)) {
                        return; // skip invalid sweep groups
                    }
                    const avgGold = path.reduce((sum, ind) => sum + ind.goldMedalPercentage, 0) / k;
                    if (avgGold > bestGoldAvg) {
                        bestGoldAvg = avgGold;
                        bestGroup = [...path];
                    }
                }
                return;
            }

            for (let i = start; i < arr.length; i++) {
                path.push(arr[i]);
                combine(arr, k, i + 1, path);
                path.pop();
            }
        }

        combine(merged, numIndividuals);
        return [bestGoldAvg ,bestGroup.map(ind => ind.name)]
    } catch (e) {
        console.error("selectIndividuals error:", e);
        return [0,[]];
    }
}

/**
 * Converts Strava activities to your custom format
 * @param {Array} activities - Array of Strava activity objects
 * @returns {Array} Formatted activities
 */
export function formatStravaActivities(activities) {
    return activities.map((act) => {
        // Format date as DD/MM/YYYY
        const dateObj = new Date(act.start_date);
        const formattedDate = `${String(dateObj.getDate()).padStart(2, "0")}/${String(
            dateObj.getMonth() + 1
        ).padStart(2, "0")}/${dateObj.getFullYear()}`;

        // Determine activity type mapping (example)
        let type = mapSportType(act.type,hasGps(act))
        let notes

        return {
            approved: false,
            date: formattedDate,
            distance: Math.round(act.distance).toString(),
            id: uuidv4(),
            intense: false,
            name: `${act.athlete.firstname} ${act.athlete.lastname}`,
            notes: getNotes(act),
            split: mpsToSplit(act["average_speed"]),
            type: type,
            weights: false,
        };
    });
}

function mapSportType(sportType, hasGps) {
    switch (sportType) {
        // Foot sports
        case "Run":
        case "TrailRun":
        case "Walk":
        case "Hike":
        case "VirtualRun":
            return "Run";

        // Cycle sports
        case "Ride":
        case "MountainBikeRide":
        case "GravelRide":
        case "EBikeRide":
        case "EMountainBikeRide":
        case "Velomobile":
        case "VirtualRide":
            return "Bike";

        // Rowing (special case with GPS flag)
        case "Rowing":
            return hasGps ? "Water" : "Erg";

        // Everything else
        default:
            return "Other";
    }
}

function hasGps(activity) {
    // check lat/lng or polyline
    return (
        activity.start_latlng &&
        activity.start_latlng.length === 2 &&
        activity.map &&
        activity.map.summary_polyline
    );
}

/**
 * Convert speed (m/s) to rowing split (mm:ss.s per 500m)
 * @param {number} speedMps - speed in meters per second
 * @returns {string} split formatted as "mm:ss.s /500m"
 */
function mpsToSplit(speedMps) {
    if (!speedMps || speedMps <= 0) return "—"; // invalid speed

    // Time (seconds) to cover 500m
    const secondsPer500m = 500 / speedMps;

    // Minutes and seconds
    const minutes = Math.floor(secondsPer500m / 60);
    const seconds = secondsPer500m % 60;

    // Format: mm:ss.s
    return `${minutes}:${seconds.toFixed(1).padStart(4, "0")} /500m`;
}

function getNotes(act) {
    let parts = [];

    if (act.name) {
        parts.push(act.name);
    }

    if (act.average_heartrate !== undefined && act.average_heartrate !== null) {
        parts.push(`Average HR: ${act.average_heartrate}`);
    }

    if (act.max_heartrate !== undefined && act.max_heartrate !== null) {
        parts.push(`Peak HR: ${act.max_heartrate}`);
    }

    return parts.join("\n");
}









