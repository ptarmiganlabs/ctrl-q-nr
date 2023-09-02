// Creata an xref object of length "xrefLength" characters
function getXref(xrefLength) {
    let xrefKey = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < xrefLength; ) {
        xrefKey += characters.charAt(Math.floor(Math.random() * characters.length));
        i += 1;
    }

    return xrefKey;
}

module.exports = {
    getXref,
};
