const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    };
};

const generateLocationMessage = (username, url) => {
    return generateMessage(username, url);
};

module.exports = {
    generateMessage,
    generateLocationMessage
};