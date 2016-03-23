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
        it('should call callback on empty array', (done) => {
            flow.serial([], () => done());
        });

        it('should call functions in right order', (done) => {
            var func1 = sinon.spy((next) => setImmediate(next(null, 1)));
            var func2 = sinon.spy((d, next) => setImmediate(next(null, 1)));

            flow.serial([func1, func2], () => {
                func1.should.have.been.calledBefore(func2);
                done();
            });
        });

        it('should call callback on second function', (done) => {
            var func1 = (next) => setImmediate(() => next(null, 1));
            var func2 = (d, next) => setImmediate(() => next(null, 2));

            flow.serial([func1, func2], (error, data) => {
                data.should.be.equal(2);
                done();
            });
        });

        it('should get result to next function', () => {
            var func1 = (next) => setImmediate(() => next(null, 1));
            var func2 = (data, next) => setImmediate(() => {
                    data.should.be.equal(1);
                    next(null, 1);
                    done();
            });

            flow.serial([func1, func2], () => {});
        });

        it('should take errors', (done) => {
            var func1 = (next) => {
                setImmediate(() => next(new Error('error!'), 1));
            };
            var func2 = (data, next) => setImmediate(() => next(null, 2));

            flow.serial([func1, func2], (error) => {
                error.message.should.be.equal('error!');
                done();
            });
        });

        it('should not run function after error', (done) => {
            var func1 = (next) => {
                setTimeout(() => next(new Error('error!'), 1), 100);
            };
            var func2 = sinon.spy((d, next) => setImmediate(next(null, 1)));

            flow.serial([func1, func2], () => {
                func2.should.not.have.been.called;
                done();
            });
        });

    });

    describe('parallel function', () => {
        it('should call callback on empty array', (done) => {
            flow.parallel([], () => done());
        });

        it('should call all funcs', (done) => {
            var func1 = sinon.spy((next) => setImmediate(() => next()));
            var func2 = sinon.spy((next) => setImmediate(() => next()));
            var func3 = sinon.spy((next) => setImmediate(() => next()));

            flow.parallel([func1, func2, func3], () => {
                func1.should.have.been.calledOnce;
                func2.should.have.been.calledOnce;
                func3.should.have.been.calledOnce;
                done();
            });
        });

        it('should call callback once', (done) => {
            var func1 = (next) => setImmediate(() => next(null, 1));
            var func2 = (next) => setImmediate(() => next(null, 1));
            var func3 = (next) => setImmediate(() => next(null, 1));

            flow.parallel([func1, func2, func3], () => done());
        });

        it('should put result in callback from each func', (done) => {
            var func1 = (next) => setImmediate(() => next(null, 1));
            var func2 = (next) => setImmediate(() => next(null, 1));
            var func3 = (next) => setImmediate(() => next(null, 1));

            flow.parallel([func1, func2, func3], (err, res) => {
                res.length.should.be.equal(3);
                done();
            });
        });

        it('should put result in callback in right order', (done) => {
            var func1 = (next) => setImmediate(() => next(null, 0));
            var func2 = (next) => setImmediate(() => next(null, 1));

            flow.parallel([func1, func2], (err, res) => {
                res[0].should.be.equal(0);
                res[1].should.be.equal(1);
                done();
            });
        });

        it('should take errors in callback', (done) => {
            var func1 = (next) => setImmediate(() => {
                next(new Error('error!'), 1);
            });
            var func2 = (next) => setImmediate(() => next(null, 1));

            flow.parallel([func1, func2], (err) => {
                err[0].message.should.be.equal('error!');
                done();
            });
        });
    });

    describe('map function', () => {
        it('should not fail without values', (done) => {
            var func = (next) => setImmediate(() => next(null, 1));

            flow.map([], func, (error, data) => {
                data.length.should.be.equal(0);
                done();
            });
        });

        it('should get correct result with same amount of values', (done) => {
            var func = (val, next) => setImmediate(() => next(null, val+1));

            flow.map([1, 2, 3], func, (err, data) => {
                data[0].should.be.equal(2);
                data[1].should.be.equal(3);
                data[2].should.be.equal(4);
                done();
            });
        });
    });
});
