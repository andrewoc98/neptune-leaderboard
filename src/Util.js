import {sessionHistory} from "./Data";
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
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
}

function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getWeekStart(date) {
    const start = new Date(date);
    start.setDate(date.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
}

function getTotalDistanceByName(data, period) {
    const today = new Date();
    let startDate = null;
    let endDate = today;

    if (period === "month") {
        startDate = getMonthStart(today);
    } else if (period === "week") {
        startDate = getWeekStart(today);
    } else if (period === "total") {
        startDate = new Date(-8640000000000000); // earliest possible date
    } else {
        throw new Error('Invalid period. Use "total", "month", or "week".');
    }

    const totals = {};

    data.forEach(entry => {
        const entryDate = parseDate(entry.date);
        if (entryDate >= startDate && entryDate <= endDate) {
            totals[entry.name] = (totals[entry.name] || 0) + entry.distance;
        }
    });

    return totals;
}

export const getSessionStats = (period) => {
    const today = new Date();
    let startDate;

    if (period === "month") {
        startDate = getMonthStart(today);
    } else if (period === "week") {
        startDate = getWeekStart(today);
    } else {
        startDate = new Date(-8640000000000000); // total
    }

    const stats = {};

    sessionHistory.forEach(entry => {
        const entryDate = parseDate(entry.date);
        if (entryDate >= startDate && entryDate <= today) {
            const { name, distance, intensity } = entry;

            if (!stats[name]) {
                stats[name] = {
                    name,
                    totalDistance: 0,
                    totalSessions: 0,
                    steadyCount: 0,
                    intensityCount: 0
                };
            }

            stats[name].totalDistance += distance;
            stats[name].totalSessions += 1;

            if (intensity) {
                stats[name].intensityCount += 1;
            } else {
                stats[name].steadyCount += 1;
            }
        }
    });

    return Object.values(stats).sort((a, b) => b.totalDistance - a.totalDistance);
};


