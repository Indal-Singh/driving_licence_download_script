function validateLicenseNumber(licenseNumber) {
    if (licenseNumber.length < 5) {
        throw new Error("License number is too short");
    }

    let fifthChar = licenseNumber.charAt(4);
    if (isNaN(fifthChar)) {
        // If the fifth character is an alphabet, remove it and add a space
        return licenseNumber.slice(0, 4) + ' ' + licenseNumber.slice(5);
    } else {
        // If the fifth character is a number, simply insert a space
        return licenseNumber.slice(0, 4) + ' ' + licenseNumber.slice(4);
    }
}

module.exports = validateLicenseNumber;