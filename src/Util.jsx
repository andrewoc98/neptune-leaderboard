import {collection, getDocs} from "firebase/firestore";
import { database } from "./firebase";

export function adjustedErgScore(split, weight) {

    const [minutesStr, secTenthsStr] = split.split(':')

    const minutes = parseInt(minutesStr, 10);
    const seconds = parseFloat(secTenthsStr);
    const totalSeconds = minutes * 60 + seconds;
    const factor = Math.pow(weight/122.47, 1 / 9);

    const adjustedSeconds = (factor*totalSeconds).toFixed(1)
    return Math.floor(adjustedSeconds/60) +":"+((adjustedSeconds%60).toFixed(1));
}

export function goldMedalPercentage(time, boatClass, distance) {
    const [minutesStr, secTenthsStr] = time.split(':')

    const minutes = parseInt(minutesStr, 10);
    const seconds = parseFloat(secTenthsStr);
    const totalSeconds = minutes * 60 + seconds;
    var gmpSpeed = 0
    switch (boatClass.toLocaleLowerCase()) {
        case "1x":
            gmpSpeed = 5.119
            return (((distance/totalSeconds)/gmpSpeed)*100).toFixed(2) + "%"
        case "2x":
            gmpSpeed = 5.56
            return (((distance/totalSeconds)/gmpSpeed)*100).toFixed(2) + "%"
        case "4x+":
            gmpSpeed = 5.76
            return (((distance/totalSeconds)/gmpSpeed)*100).toFixed(2) + "%"
        case "4x-":
            gmpSpeed = 6.02
            return (((distance/totalSeconds)/gmpSpeed)*100).toFixed(2) + "%"
        case "2-":
            gmpSpeed = 5.43
            return (((distance/totalSeconds)/gmpSpeed)*100).toFixed(2) + "%"
        case "4+":
            gmpSpeed = 5.749
            return (((distance/totalSeconds)/gmpSpeed)*100).toFixed(2) + "%"
        case "8+":
            gmpSpeed = 6.276
            return (((distance/totalSeconds)/gmpSpeed)*100).toFixed(2) + "%"
        case "4-":
            gmpSpeed = 5.919
            return (((distance/totalSeconds)/gmpSpeed)*100).toFixed(2) + "%"
        default:
            return "PLEASE CHECK BOAT CLASS"

    }
}

function parseDate(dateStr) {
    console.log(dateStr)
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
}

function getMonthStart(date) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed (0 = Jan, 1 = Feb, etc.)
    const day = date.getDate();

    // Move to the previous month
    const prevMonthDate = new Date(year, month - 1, day);

    // If the month rolled over (e.g., from March 31 to March 3), fix by setting day to last day of previous month
    if (prevMonthDate.getMonth() !== (month - 1 + 12) % 12) {
        // Set day to 0 of current month to get last day of previous month
        return new Date(year, month, 0);
    }

    return prevMonthDate;
}

function getWeekStart(date) {
    const start = new Date(date);
    start.setDate(date.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
}

async function getAllSessionHistory() {
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


export async function getSessionStats(period) {
    const today = new Date();
    let startDate;

    if (period === "month") {
        startDate = getMonthStart(today);
    } else if (period === "week") {
        startDate = getWeekStart(today);
    } else {
        startDate = new Date(-8640000000000000); // earliest possible date
    }

    const stats = {};
    const allSessions = await getAllSessionHistory();
    allSessions.forEach(entry => {
        if(entry.approved) {
            const entryDate = parseDate(entry.date);
            if (entryDate >= startDate && entryDate <= today) {
                const {name, distance, intensity, weights} = entry;
                console.log('running stats for ' + name)
                if (!stats[name]) {
                    console.log('adding ' + name)
                    stats[name] = {
                        name,
                        totalDistance: 0,
                        totalSessions: 0,
                        steadyCount: 0,
                        intensityCount: 0,
                        weightsCount: 0
                    };
                }

                stats[name].totalDistance += distance;
                stats[name].totalSessions += 1;

                if (intensity) {
                    stats[name].intensityCount += 1;
                } else if (weights) {
                    stats[name].weightsCount += 1;
                } else {
                    stats[name].steadyCount += 1;
                }
            }
        }});
    const output = Object.values(stats).sort((a, b) => b.totalDistance - a.totalDistance);
    console.log("------------------------------")
    console.log(output)
    console.log("------------------------------")
    return output
}

export async function getDistanceForLastPeriod(period) {
    const today = new Date();

    const getLastMonthStart = (date) => new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const getLastWeekStart = (date) => {
        const startOfThisWeek = new Date(date);
        startOfThisWeek.setHours(0, 0, 0, 0);
        startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());
        const lastWeekStart = new Date(startOfThisWeek);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        return lastWeekStart;
    };

    let startDate, endDate;

    if (period === "month") {
        startDate = getLastMonthStart(today);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === "week") {
        startDate = getLastWeekStart(today);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
    } else {
        return {};
    }

    const distanceMap = {};
    const allSessions = await getAllSessionHistory();

    allSessions.forEach(entry => {
        const entryDate = parseDate(entry.date);
        if (entryDate >= startDate && entryDate <= endDate) {
            const { name, distance } = entry;
            if (!distanceMap[name]) {
                distanceMap[name] = 0;
            }
            distanceMap[name] += distance;
        }
    });

    return distanceMap;
}

export async function  getUnApprovedSessions(){

    const allSessions = await getAllSessionHistory();

    return allSessions.filter(item => item.approved === false);

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





