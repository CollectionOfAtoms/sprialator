function scalePathToFit(pathString) {
    // Regex to match all numbers in the path string, including decimals and negatives
    const numberPattern = /-?\d+(\.\d+)?/g;
    let allNumbers = pathString.match(numberPattern).map(Number);

    // Separate x and y values based on their order
    let xValues = allNumbers.filter((_, i) => i % 2 === 0);
    let yValues = allNumbers.filter((_, i) => i % 2 !== 0);

    // Find min and max for x and y
    let minX = Math.min(...xValues);
    let maxX = Math.max(...xValues);
    let minY = Math.min(...yValues);
    let maxY = Math.max(...yValues);

    // Determine scale based on the largest range in x or y to fit within [-0.5, 0.5]
    let rangeX = maxX - minX;
    let rangeY = maxY - minY;
    let maxRange = Math.max(rangeX, rangeY);
    let scaleFactor = 1 / maxRange;

    // Adjust scale to fit in the target range
    scaleFactor *= 0.5; // Because we want to fit it into [-0.5, 0.5] range

    // Calculate new min and max after scaling
    let scaledMinX = minX * scaleFactor;
    let scaledMinY = minY * scaleFactor;

    // Calculate translation to center the path
    let translateX = (0.5 - scaledMinX) - (rangeX * scaleFactor / 2);
    let translateY = (0.5 - scaledMinY) - (rangeY * scaleFactor / 2);

    // Improved number formatting function
    function formatNumber(number) {
        // Ensure we're working with a floating-point number
        let num = parseFloat(number);
        // Round to a maximum of 3 decimal places
        num = num.toFixed(3);
        // Remove any trailing zeros after the decimal point and unnecessary leading zeros
        num = parseFloat(num).toString();
        return num;
    }

    // Adjust the replacement function to format numbers correctly
    let newPathString = pathString.replace(/-?\d+(\.\d+)?/g, (match, offset) => {
        let number = Number(match);
        let scaledNumber = (offset % 2 === 0) ? (number * scaleFactor) + translateX : (number * scaleFactor) + translateY;
        // Use the improved formatNumber function
        return formatNumber(scaledNumber);
    });
    
    return newPathString;
}

export {scalePathToFit}