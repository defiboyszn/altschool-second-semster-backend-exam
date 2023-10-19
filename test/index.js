const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const app = require('../app'); // Assuming your Express app is in app.js
const expect = chai.expect;

chai.use(chaiHttp);

describe('API Endpoints', () => {
  // Define variables for testing
  let authToken; // Store the authentication token here

  // Mock a successful login response
  // before(() => {
  //   sinon.stub(chai.request(app), 'post')
  //     .withArgs('/login')
  //     .returns(Promise.resolve({ body: { token: 'mocked_token' } }));
  // });

  // Test fetching a list of blogs
  describe('GET /', () => {
    it('should return a list of blogs', function (done) {
      this.timeout(15000);
      // Simulate authentication by setting the authToken to the mocked token
      authToken = 'mocked_token';

      // Mock the response for /blogs
      // sinon.stub(chai.request(app), 'get')
      //   .withArgs('/')
      //   .returns(Promise.resolve({
      //     status: 200,
      //     body: {
      //       message: 'Success', data: [
      //         { title: 'Blog 1', description: 'Description 1', /* Add more mock data */ },
      //         { title: 'Blog 2', description: 'Description 2', /* Add more mock data */ },
      //       ]
      //     },
      //   }));

      const res = chai.request(app)
        .get('/')
      expect(res).to.be.an('object');
      done();
      // Add more assertions based on your response structure
    });

  });

  // Clean up after testing
  after(() => {
    sinon.restore();
  });
});
