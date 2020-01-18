
function isObject(val) {
    if (val === null) {
        return false;
    }
    return ((typeof val === 'function') || (typeof val === 'object'));
}

envLog = function () {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev") {
        console.log.apply(this, arguments);
    }
};

module.exports.isObject = isObject;
module.exports.envLog = envLog;
