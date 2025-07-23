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

