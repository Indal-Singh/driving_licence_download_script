function isValidDOB(dob) {
    // Regular expression to match the format DD-MM-YYYY
    const dobRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;

    // Check if the input matches the regex
    if (!dobRegex.test(dob)) {
        return false;
    }

    // Further check for valid date (e.g., February 30th should be invalid)
    const [day, month, year] = dob.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    // Validate the constructed date
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

module.exports = isValidDOB;