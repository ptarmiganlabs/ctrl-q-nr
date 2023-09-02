//  Headers for Qlik Sense API calls are built in the getHeaders() function.
function getHeaders(xref) {
    const headers = {
        'X-Qlik-Xrfkey': xref,
        'X-Qlik-User': 'UserDirectory=Internal; UserId=sa_api',
    };

    return headers;
}

module.exports = {
    getHeaders,
};
