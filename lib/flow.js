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

exports.parallel = function (funcs, callback) {
    var results = [];
    var errors = [];
    if (funcs.length == 0) {
        callback(null, results);
    }
    var createCallback = (index, resolve) => {
        return (err, data) => {
            results[index] = data;
            if (err) {
                errors[index] = err;
            }
            resolve();
        };
    };
    Promise.all(funcs.map((func, index) => {
        return new Promise(resolve => {
            func(createCallback(index, resolve));
        })
    }))
    .then(() => {
        callback(errors, results);
    }, (err) => console.log(err));
};


exports.map = (values, func, callback) => {
    if (values.length === 0) {
        callback(null, []);
        return;
    }
    var functions = [];
    values.forEach((value) => {
        functions.push(func.bind(this, value));
    });
    this.parallel(functions, callback);
};