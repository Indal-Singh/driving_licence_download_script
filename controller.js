const { chromium } = require('playwright');
const ApiError = require('./utils/ApiError');
const isValidDOB = require('./utils/validateDob');
const ApiResponse = require('./utils/ApiResponse');
const solvedCaptcha = require('./utils/solvedCaptcha');
const validateLicenseNumber = require('./utils/validateLicenseNumber');


const downloadDLimageAndSign = async (req, res) => {
    let { dlNumber, dob } = req.body;
    if (!dlNumber || !dob) {
        const error = new ApiError(400, "DL Number and DOB are required.");
        return res.status(error.statusCode).json(error.format());
    }
    if (!isValidDOB(dob)) {
        const error = new ApiError(400, "Please Enter DOB in DD-MM-YYYY");
        return res.status(error.statusCode).json(error.format());
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do');
    await page.selectOption('#stfNameId', 'JH');
    await page.waitForTimeout(2000);

    const menuLinks = page.locator('#navbarDropdownMenuLink');
    const totalLinks = await menuLinks.count();
    if (totalLinks >= 3) {
        await menuLinks.nth(totalLinks - 3).click();
    } else {
        const error = new ApiError(500, "Internal Server Error.");
        return res.status(error.statusCode).json(error.format());
    }

    await page.click('a[href*="relatedAppln.do"]');
    await page.selectOption('#AppRelation', 'DL No');

    await page.fill("#applNum", dlNumber); // DL number
    await page.fill("#dateOfBirth", dob); // DOB 

    // Wait for the CAPTCHA image to load
    await page.waitForSelector('#capimg');

    // Render the CAPTCHA image onto a canvas in the page context
    const base64Data = await page.evaluate(() => {
        const captchaImg = document.querySelector('#capimg');
        if (!captchaImg) {
            const error = new ApiError(500, "Internal Server Error Related To CAPTCHA");
            return res.status(error.statusCode).json(error.format());
        }

        const canvas = document.createElement('canvas');
        canvas.width = captchaImg.width;
        canvas.height = captchaImg.height;
        const context = canvas.getContext('2d');
        context.drawImage(captchaImg, 0, 0);

        return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
    });

    // Solve CAPTCHA using the API

    try {
        const captchaText = await solvedCaptcha(base64Data);

        // console.log('Captcha solved:', captchaText);
        await page.fill('#captxt', captchaText);
        await page.click('#submit');

        await page.waitForTimeout(2000);

        // Wait for the table to load
        await page.waitForSelector('.table');

        // Extract RTO Name, Name, and Father's Name
        const { rtoName, name, fatherName } = await page.evaluate(() => {
            const cells = Array.from(document.querySelectorAll('.table td'));

            let rtoName = null;
            let name = null;
            let fatherName = null;

            // Helper function to clean up cell text
            const cleanText = (text) => text.replace(/\s+/g, ' ').trim();

            for (let i = 0; i < cells.length; i++) {
                const cellText = cleanText(cells[i].textContent);

                // Extract RTO Name
                if (cellText === 'RTO Name:') {
                    rtoName = cleanText(cells[i + 1]?.querySelector('b')?.textContent || '');
                }
                // Extract Name
                else if (cellText === 'Name:') {
                    name = cleanText(cells[i + 1]?.querySelector('b')?.textContent || '');
                }
                // Extract Father's Name
                else if (cellText.includes("Father's Name")) {
                    fatherName = cleanText(cells[i + 1]?.querySelector('b')?.textContent || '');
                }
            }

            return { rtoName, name, fatherName };
        });


        // Click on the viewImages button
        await page.waitForSelector('#viewImages input');
        await page.click('#viewImages input');

        // Wait for images to load in the container with ID 'images'
        await page.waitForSelector('#images img');

        // Extract the src attribute of the second image
        const imageSrcs = await page.$$eval('#images img', images => images.map(img => img.src));
        if (imageSrcs.length >= 2) {
            const profileImage = imageSrcs[0];
            const signImage = imageSrcs[1];
            const dlDetails = {
                dlNumber: dlNumber,
                dob: dob,
                name: name,
                fatherName: fatherName,
                rtoName: rtoName,
                profileImage: profileImage,
                signImage: signImage
            }
            // close 
            await browser.close();
            return res.status(200).json(new ApiResponse(
                200,
                { dlDetails: dlDetails },
                "DL Basic Details Found."
            ));
            //    console.log('Second image src:', imageSrcs[1]);
        } else {
            const error = new ApiError(500, "Internal Server Error Related To Image");
            return res.status(error.statusCode).json(error.format());
        }

    } catch (err) {
        console.log(err);
        const error = new ApiError(500, "Internal Server Error Filling Captcha");
        return res.status(error.statusCode).json(error.format());
    }
}


const downloadDLimageAndSignNew = async (req, res) => {
    let { dlNumber, dob } = req.body;
    if (!dlNumber || !dob) {
        const error = new ApiError(400, "DL Number and DOB are required.");
        return res.status(error.statusCode).json(error.format());
    }
    if (!isValidDOB(dob)) {
        const error = new ApiError(400, "Please Enter DOB in DD-MM-YYYY");
        return res.status(error.statusCode).json(error.format());
    }
    dlNumber = validateLicenseNumber(dlNumber);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do');
    await page.selectOption('#stfNameId', 'JH');
    await page.waitForTimeout(2000);

    const menuLinks = page.locator('.icon-list a[href="dlServicesDet.do"]');
    const totalLinks = await menuLinks.count();
    if (totalLinks >= 3) {
        await menuLinks.nth(3).click();
    } else {
        const error = new ApiError(500, "Internal Server Error.");
        return res.status(error.statusCode).json(error.format());
    }

    await page.waitForTimeout(2000);

    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('input'));
        const targetButton = buttons.find(button => button.getAttribute('onclick')?.includes("location.href='envaction.do'"));
        if (targetButton) {
            targetButton.click();
        }
    });


    await page.fill("#dlno", dlNumber); // DL number
    await page.fill("#dob", dob); // DOB 

    // Wait for the CAPTCHA image to load
    await page.waitForSelector('#capimg');

    // Render the CAPTCHA image onto a canvas in the page context
    const base64Data = await page.evaluate(() => {
        const captchaImg = document.querySelector('#capimg');
        if (!captchaImg) {
            const error = new ApiError(500, "Internal Server Error Related To CAPTCHA");
            return res.status(error.statusCode).json(error.format());
        }

        const canvas = document.createElement('canvas');
        canvas.width = captchaImg.width;
        canvas.height = captchaImg.height;
        const context = canvas.getContext('2d');
        context.drawImage(captchaImg, 0, 0);

        return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
    });

    // Solve CAPTCHA using the API

    try {
        const captchaText = await solvedCaptcha(base64Data);
        // console.log('Captcha solved:', captchaText);
        await page.fill('#entCaptha', captchaText);
        await page.check('#PrivacyPolicyTermsofService');
        await page.click('#GetDLDetails');

        await page.waitForTimeout(2000);

        // // Extract RTO Name, Name, and Father's Name
        const { name, fatherName } = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('.table.NALOC tr'));

            let name = null;
            let fatherName = null;

            // Helper function to clean up cell text
            let cleanText = (text) => text.replace(/\s+/g, ' ').trim();
            for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td');
            if (cells.length === 2) {
                const label = cleanText(cells[0].textContent.trim());
                const value = cleanText(cells[1].textContent.trim());

                // Extract Name
                if (label.includes('Name :')) {
                name = value;
                }
                // Extract Father's Name
                else if (label.includes("Father's Name :")) {
                fatherName = value;
                }
            }
            }

            return { name, fatherName };
        });

        await page.waitForTimeout(2000);
        // extract Rto and state 
        const { state, rto } = await page.evaluate(() => {
            const targetedElement = Array.from(document.querySelectorAll('.col-md-4.text-center b.text-success'));
            const stateElement = targetedElement[0];
            const rtoElement = targetedElement[1];

            const state = stateElement ? stateElement.nextSibling.textContent.trim() : null;
            const rto = rtoElement ? rtoElement.nextSibling.textContent.trim() : null;

            return { state, rto };
        });

        // extracting veichel class 
        const vehicleDetails = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('.table.text-center.bold.NALOC tr'));
            const details = [];

            for (let i = 1; i < rows.length; i++) { 
            const cells = rows[i].querySelectorAll('td');
            if (cells.length > 0) {
                const vehicleClass = cells[0].textContent.trim();
                const issueDate = cells[1]?.textContent.trim() || '';
                const authority = cells[2]?.textContent.trim() || '';
                details.push({ vehicleClass, issueDate, authority });
            }
            }

            return details;
        });

        // extract issue date and expiry date from here 
        const validityPeriod = await page.evaluate(() => {
            const validityElement = document.querySelector('#envaction_dl_nt').parentElement.nextElementSibling;
            const validityText = validityElement ? validityElement.textContent.trim() : null;

            let issueDate = null;
            let expiryDate = null;

            if (validityText) {
                const dates = validityText.split(' to ');
                if (dates.length === 2) {
                    issueDate = dates[0];
                    expiryDate = dates[1];
                }
            }

            return { issueDate, expiryDate };
        });

        const { issueDate, expiryDate } = validityPeriod;

        // Extract the src attribute of the photo and sign images
        const photoSrc = await page.$eval('#imgDiv img', img => img.src);
        const signSrc = await page.$eval('#signDiv img', img => img.src);
       
        if (photoSrc != "") {
            const profileImage = photoSrc;
            const signImage = signSrc;
            const dlDetails = {
                dlNumber: dlNumber,
                dob: dob,
                name: name,
                fatherName: fatherName,
                state : state,
                rtoName:rto,
                vehicleDetails:vehicleDetails,
                issueDate:issueDate,
                expiryDate:expiryDate,
                profileImage: profileImage,
                signImage: signImage
            }
            // close 
            await browser.close();
            return res.status(200).json(new ApiResponse(
                200,
                { dlDetails: dlDetails },
                "DL Basic Details Found."
            ));
            //    console.log('Second image src:', imageSrcs[1]);
        } else {
            const error = new ApiError(500, "Internal Server Error Related To Image");
            return res.status(error.statusCode).json(error.format());
        }

    } catch (err) {
        await browser.close();
        const error = new ApiError(500, "Internal Server Error Filling Captcha");
        return res.status(error.statusCode).json(error.format());
    }
}

module.exports = { downloadDLimageAndSign,downloadDLimageAndSignNew }