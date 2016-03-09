var mocha = require('mocha');
var sinon = require('sinon');
var assert = require('assert');
var flow = require('../lib/flow.js');
var chai = require('chai').should();

describe('Flow module', () => {
    describe('serial function', () => {
        it('should call callback on empty array', () => {
            var spy = sinon.spy();
            flow.serial([], spy);
            spy.should.have.been.calledOnce;
        });

        it('should call funcs in right order', () => {
            var func1 = sinon.spy(next => {
                next(null, undefined);
            });
            var func2 = sinon.spy((data, next) => {
                next(null, undefined);
            });
            flow.serial([func1, func2], (error, data) => {});

            assert(func2.calledAfter(func1));
            //func2.should.have.been.calledAfter(func1);// why doesn't work?
        });

        it('should call callback on second function', () => {
            var func1 = (next) => {
                next(null, 1)
            };
            var func2 = (data, next) => {
                next(null, 2)
            };
            var callback = sinon.spy((error, data) => {});
            flow.serial([func1, func2], callback);
            assert(callback.calledWithExactly(null, 2));
        });

        it('should get res to next func', () => {
            var func1 = (next) => {
                next(null, 1)
            };
            var func2 = sinon.spy((data, next) => {
                next(null, 2)
            });
            flow.serial([func1, func2], (e, d) => {});
            assert(func2.calledWith(1));
        });

        it('should take errors', () => {
            var func1 = (next) => {
                next('error!', 1)
            };
            var func2 = sinon.spy((data, next) => {
                next(null, 2)
            });
            var callback = sinon.spy((error, data) => {});
            flow.serial([func1, func2], callback);
            assert(callback.calledWithExactly('error!', 1));
        });

        it('should not run func after error', () => {
            var func1 = (next) => {
                next('error!', 1)
            };
            var func2 = sinon.spy((data, next) => {
                next(null, 2)
            });
            flow.serial([func1, func2], (error, data) => {});
            assert(!func2.called);
        });

    });

    describe('parallel function', () => {
        it('should call callback on empty array', () => {
            var callback = sinon.spy();
            flow.parallel([], callback);
            callback.should.have.been.calledOnce;
        });

        it('should call all funcs', function() {
            var func1 = sinon.spy();
            var func2 = sinon.spy();
            var func3 = sinon.spy();
            flow.parallel([func1, func2, func3], (err, data) => {});

            func1.should.have.been.calledOnce;
            func2.should.have.been.calledOnce;
            func3.should.have.been.calledOnce;
        });

        it('should call callback after each funcs', function() {
            var func1 = (next) => {};
            var func2 = (next) => {};
            var func3 = (next) => {};
            var callback = sinon.spy();
            flow.parallel([func1, func2, func3], callback);

            callback.should.have.been.calledThrise;
        });

        it('should put result in callback from each func', () => {
            var func1 = (next) => {
                next(null, 1);
            }
            var func2 = (next) => {
                next(null, 2);
            }
            var func3 = (next) => {
                next(null, 3);
            }
            var callback = (err, res) => {
                assert.equal(res.length, 3);
            };
            flow.parallel([func1, func2, func3], callback);
        });

        it('should put result in callback in right order', function () {
            var func1 = next => {
                next(null, 0);
            }
            var func2 = next => {
                next(null, 1);
            }
            var callback = (err, res) => {
                assert.equal(res[0], 0);
                assert.equal(res[1], 1);
            };
            flow.parallel([func1, func2], callback);
        });

        it('should take errors in callback', () => {
            var func1 = next => {
                next('error!', 0)
            };
            var func2 = sinon.spy(next => {
                next(null, 1)
            });
            var callback = sinon.spy((error, data) => {});
            flow.parallel([func1, func2], callback);

            assert(callback.calledWith('error!'));
        });

        it('should not run all callbacks after error', () => {
            var func1 = next => {
                next('error!', 1)
            };
            var func2 = next => {
                next(null, 2)
            };
            var callback = (error, data) => {
                assert.deepEqual(data, [1]);
            };
            flow.parallel([func1, func2], callback);
        });
    });

    describe('map function', () => {
        it('should not fail without values', () => {
            var callback = sinon.spy((error, data) => {});
            flow.map([], (next) => {}, callback);

            assert(callback.calledWithExactly(null, []));
        });

        it('should get correct result with same amount of values', () => {
            var func = (val, next) => {
                next(null, val + 1);
            };
            var callback = sinon.spy((error, data) => {});
            flow.map([1, 2, 3], func, callback);

            assert(callback.calledWithExactly(null, [2, 3, 4]));
        });
    });
});
