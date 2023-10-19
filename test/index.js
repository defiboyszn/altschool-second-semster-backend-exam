const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const expect = chai.expect;

chai.use(chaiHttp);

describe('API Endpoints', () => {
  describe('GET /', () => {
    it('should return a list of blogs', function (done) {
      this.timeout(15000);

      const res = chai.request(app)
        .get('/')
      expect(res).to.be.an('object');
      done();
    });

  });
});
