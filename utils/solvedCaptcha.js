const ApiError = require("./ApiError");

const solvedCaptcha = async (base64Data) => {
    const apiUrl = 'https://api.dhboss.com/apicall/captcha_image_to_text/';
    const apiKey = 'fTmRVcsf2Aqe6ep1FXxOgU1ZknphnDHdfNdIG30uMwrKbzLMucvTDrH8xV5jxbNG4YTrqH';

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            apikeyfill: apiKey,
            image_url: `data:image/png;base64,${base64Data}`
        })
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
    }

    const result = await response.json();
    if(result.status=='success')
    {
        return result.response.text;
    }
    else
    {
        throw new Error(`Error: ${result.msg}`);
    }
};

module.exports = solvedCaptcha;