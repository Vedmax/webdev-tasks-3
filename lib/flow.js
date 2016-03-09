'use strict';

exports.serial = (functions, callback) => {
    var index = 0;
    if (functions.length === 0) {
        callback(null, null);
        return;
    }
    var makeCallback = (error, data) => {
        index++;
        if (error || functions.length == index) {
            callback(error, data);
        } else {
            functions[index](data, makeCallback);
        }
    };
    functions[index](makeCallback);
};

exports.parallel = (functions, callback) => {
    var result = [];
    if (functions.length == 0) {
        callback(null, result);
    }
    var alreadyHasError = false;
    var makeCallback = (index) => {
        return (error, data) => {
            result[index] = data;
            if (alreadyHasError) {
                return;
            }
            if (error || index == functions.length - 1) {
                callback(error, result);
            }
            if (error) {
                alreadyHasError = true;
            }
        };
    };
    functions.forEach((func, index) => func(makeCallback(index)));
};

exports.map = (values, func, callback) => {
    if (!values) {
        callback(null, []);
    }
    var functions = [];
    values.forEach((value) => {
        functions.push(func.bind(this, value));
    });
    this.parallel(functions, callback);
};