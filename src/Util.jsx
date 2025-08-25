import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import {database, getMultipliers} from "./firebase";
import { TbFishBone, TbFish } from 'react-icons/tb';
import { GiPorcupinefish, GiSharkJaws, GiDolphin, GiSpermWhale, GiAnglerFish, GiTropicalFish, GiSnakeTongue, GiSadCrab, GiTadpole } from 'react-icons/gi';
import './App.css';

export function adjustedErgScore(split, weight) {

    const [minutesStr, secTenthsStr] = split.split(':')

    const minutes = parseInt(minutesStr, 10);
    const seconds = parseFloat(secTenthsStr);
    const totalSeconds = minutes * 60 + seconds;
    const factor = Math.pow(weight / 122.47, 1 / 9);

    const adjustedSeconds = (factor * totalSeconds).toFixed(1)
    return Math.floor(adjustedSeconds / 60) + ":" + ((adjustedSeconds % 60).toFixed(1));
}

export function goldMedalPercentage(time, boatClass, distance) {
    const [minutesStr, secTenthsStr] = time.split(':');
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseFloat(secTenthsStr);
    const totalSeconds = minutes * 60 + seconds;

    let gmpSpeed = 0;
    switch (boatClass.toLowerCase()) {
        case "1x": gmpSpeed = 5.119; break;
        case "2x": gmpSpeed = 5.56; break;
        case "4x+": gmpSpeed = 5.76; break;
        case "4x-": gmpSpeed = 6.02; break;
        case "2-": gmpSpeed = 5.43; break;
        case "4+": gmpSpeed = 5.749; break;
        case "8+": gmpSpeed = 6.276; break;
        case "4-": gmpSpeed = 5.919; break;
        default: return NaN; // instead of a string
    }

    return (distance / totalSeconds) / gmpSpeed * 100;
}
export const getDistanceMultiplier = async () => {
    return await getMultipliers();
};

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

function parseDate(dateStr) {
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

export function formatDate(date) {
    const [year, month, day] = date.split('/');
    return `${day}/${month}/${year}`;
}


export async function getSessionStats(period) {
    const distanceMultiplier = await getDistanceMultiplier()
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
        if (entry.approved) {
            const entryDate = parseDate(entry.date);
            if (entryDate >= startDate && entryDate <= today) {
                const { name, distance, intense, weights, type } = entry;

                if (!stats[name]) {

                    stats[name] = {
                        name,
                        totalDistance: 0,
                        totalSessions: 0,
                        steadyCount: 0,
                        intensityCount: 0,
                        weightsCount: 0
                    };
                }

                stats[name].totalDistance = stats[name].totalDistance + (Number(distance) * distanceMultiplier[type]);
                stats[name].totalSessions += 1;

                if (intense) {
                    stats[name].intensityCount += 1;
                } else if (weights) {
                    stats[name].weightsCount += 1;
                } else {
                    stats[name].steadyCount += 1;
                }
            }
        }
    });
    const output = Object.values(stats).sort((a, b) => b.totalDistance - a.totalDistance);

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
            distanceMap[name] += Number(distance);
        }
    });



    return distanceMap;
}

export async function getUnApprovedSessions() {

    const allSessions = await getAllSessionHistory();

    return allSessions.filter(item => item.approved === false);

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

        const [dayA, monthA, yearA] = a.date.split('/').map(Number);
        const [dayB, monthB, yearB] = b.date.split('/').map(Number);

        // Descending: compare year, month, day in reverse
        if (yearA !== yearB) return yearB - yearA;
        if (monthA !== monthB) return monthB - monthA;
        return dayB - dayA;
    });
}

export function selectIndividuals(data, users, numIndividuals, maxAveragePoints, type) {
    console.log(users)
    try {
        const waterData = data.waterData || [];
        if (numIndividuals <= 0 || waterData.length === 0) return [];

        // Merge goldMedalPercentage with selected points type
        const merged = waterData.map(d => {
            const user = users[d.name];
            if (!user) return null;

            if (type === "scull") {
                if (user.scull === undefined) return null;
                return {
                    name: d.name,
                    goldMedalPercentage: Number(goldMedalPercentage(d.time, d.boatClass, d.distance)),
                    points: user.scull
                };
            } else if (type === "sweep") {
                if (!user.sweep || user.sweep.points === undefined) return null;
                return {
                    name: d.name,
                    goldMedalPercentage: Number(goldMedalPercentage(d.time, d.boatClass, d.distance)),
                    points: user.sweep.points,
                    side: user.sweep.side // Bow, Stroke, or Both
                };
            }

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
        return bestGroup.map(ind => ind.name);
    } catch (e) {
        console.error("selectIndividuals error:", e);
        return [];
    }
}









