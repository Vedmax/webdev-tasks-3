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

exports.parallel = (funcs, callback) => {
    var result = [];
    if (funcs.length == 0) {
        callback(null, result);
    }
    var hasError = false;
    var makeCallback = (index) => {
        return (error, data) => {
            result[index] = data;
            if (hasError) {
                return;
            }
            if (error || index == funcs.length - 1) {
                callback(error, result);
            }
            if (error) {
                hasError = true;
            }
        };
    };
    funcs.forEach((func, index) => func(makeCallback(index)));
};

exports.map = (values, func, callback) => {
    var functions = [];
    if (!values) {
        callback(null, []);
    }
    values.forEach((value) => {
        functions.push(func.bind(this, value));
    });
    this.parallel(functions, callback);
};