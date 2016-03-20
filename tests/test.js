var mocha = require('mocha');
var sinon = require('sinon');
var assert = require('assert');
var flow = require('../lib/flow.js');
var chai = require('chai');
var sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);

describe('Flow module', () => {
    describe('serial function', () => {
        it('should call callback on empty array', () => {
            var spy = sinon.spy();
            flow.serial([], spy);
            spy.should.have.been.calledOnce;
        });

        it('should call funcs in right order', (done) => {
            var i = 0;
            var func1 = (next) => {
                setTimeout(() => next(null, i+=2), 1000);
            };
            var func2 = (data, next) => {
                setTimeout(() => next(null, i*=2));
            };
            flow.serial([func1, func2], (error, data) => {
                i.should.be.equal(4);
                done();
            });
        });

        it('should call callback on second function', (done) => {
            var func1 = (next) => {
                setTimeout(() => next(null, 1));
            };
            var func2 = (data, next) => {
                setTimeout(() => next(null, 2));
            };
            var callback = sinon.spy((error, data) => {
                data.should.be.equal(2);
                done();
            });
            flow.serial([func1, func2], callback);
        });

        it('should get res to next func', () => {
            var func1 = (next) => {
                setTimeout(() => next(null, 1), 1000);
            };
            var func2 = (data, next) => {
                setTimeout(() => {
                    data.should.be.equal(1);
                    next(null, 1);
                });
            };
            flow.serial([func1, func2], (e, d) => done());
        });

        it('should take errors', (done) => {
            var func1 = (next) => {
                setTimeout(() => next('error!', 1));
            };
            var func2 = (data, next) => {
                setTimeout(() => next(null, 2));
            };
            var callback = sinon.spy((error, data) => {
                error.should.not.be.equal(null);
                done();
            });
            flow.serial([func1, func2], callback);
        });

        it('should not run func after error', (done) => {
            var func1 = (next) => {
                setTimeout(() => next('error!', 1))
            };
            var func2 = sinon.spy((data, next) => {
                setTimeout(() => next(null, 2))
            });
            flow.serial([func1, func2], (error, data) => { done() });
            assert(!func2.called);
        });

    });

    describe('parallel function', () => {
        it('should call callback on empty array', () => {
            var callback = sinon.spy();
            flow.parallel([], callback);
            callback.should.have.been.calledOnce;
        });

        it('should call all funcs', (done) => {
            var func1 = sinon.spy((next) => setTimeout(() => next()));
            var func2 = sinon.spy((next) => setTimeout(() => next()));
            var func3 = sinon.spy((next) => setTimeout(() => next()));
            flow.parallel([func1, func2, func3], (err, data) => {
                func1.should.have.been.calledOnce;
                func2.should.have.been.calledOnce;
                func3.should.have.been.calledOnce;
                done();
            });
        });

        it('should call callback once', (done) => {
            var i = 0;
            var func1 = (next) => setTimeout(() => next(null, 1));
            var func2 = (next) => setTimeout(() => next(null, 1));
            var func3 = (next) => setTimeout(() => next(null, 1));
            var callback = () => {
                i.should.be.equal(0);
                i++;
                done();
            };
            flow.parallel([func1, func2, func3], callback);
        });

        it('should put result in callback from each func', (done) => {
            var func1 = (next) => setTimeout(() => next(null, 1));
            var func2 = (next) => setTimeout(() => next(null, 1));
            var func3 = (next) => setTimeout(() => next(null, 1));

            var callback = (err, res) => {
                res.length.should.be.equal(3);
                done();
            };
            flow.parallel([func1, func2, func3], callback);
        });

        it('should put result in callback in right order', (done) => {
            var func1 = (next) => setTimeout(() => next(null, 0));
            var func2 = (next) => setTimeout(() => next(null, 1));
            var callback = (err, res) => {
                res[0].should.be.equal(0);
                res[1].should.be.equal(1);
                done();
            };
            flow.parallel([func1, func2], callback);
        });

        it('should take errors in callback', (done) => {
            var func1 = (next) => setTimeout(() => {
                next(new Error('error!'), 1);
            });
            var func2 = (next) => setTimeout(() => next(null, 1));
            var callback = sinon.spy((err, data) => {
                err[0].message.should.be.equal('error!');
                done();
            });
            flow.parallel([func1, func2], callback);

        });
    });

    describe('map function', () => {
        it('should not fail without values', (done) => {
            var callback = sinon.spy((error, data) => {
                data.length.should.be.equal(0);
                done();
            });
            var func2 = (next) => setTimeout(() => next(null, 1));
            flow.map([], func2, callback);
        });

        it('should get correct result with same amount of values', (done) => {
            var func = (val, next) => {
                next(null, val + 1);
            };
            var callback = sinon.spy((error, data) => {
                data[0].should.be.equal(2);
                data[1].should.be.equal(3);
                data[2].should.be.equal(4);
                done();
            });
            flow.map([1, 2, 3], func, callback);

        });
    });
});
