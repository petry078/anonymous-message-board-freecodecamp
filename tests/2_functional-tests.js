const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  const testBoard = 'functional_test_board';
  let threadId = 'fakeId';
  let replyId = 'fakeId';

  test('Creating a new thread: POST request to /api/threads/{board}', (done) => {
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        'board': testBoard,
        'text': 'functional testing thread',
        'delete_password': 'mypassword',
      })
      .end((err, res) => {
        if (err) {
          console.error(err);
          assert.fail('Error running test');
        } else {
          assert.equal(res.status, 200);
          // Check that we redirected to the message board
          assert.include(res.text, `h1 id='boardTitle'`);
        }
        done();
      });
  });

  test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', (done) => {
    const threadObjectKeys = [
      '_id',
      'text',
      'created_on',
      'bumped_on',
      'replies',
      'replycount'];

    chai.request(server)
      .get(`/api/threads/${testBoard}`)
      .end((err, res) => {
        if (err) {
          console.error(err);
          assert.fail('Error running test');
        } else {
          assert.equal(res.status, 200);
          assert.isArray(res.body, 'Response should be an Array');
          assert.hasAllKeys(res.body[0], threadObjectKeys, 'Missing key(s) from thread object');
          assert.doesNotHaveAnyKeys(res.body[0], ['reported', 'delete_password']);
          assert.isArray(res.body[0]['replies'], 'replies is not an array');
          // Save threadId and replyId
          threadId = res.body[0]['_id'];
        }
        done();
      });
  });

  test('Creating a new reply: POST request to /api/replies/{board}', (done) => {
    chai.request(server)
      .post(`/api/replies/${testBoard}`)
      .send({
        'thread_id': threadId,
        'text': 'functional testing thread reply',
        'delete_password': 'mypassword',
      })
      .end((err, res) => {
        if (err) {
          console.error(err);
          assert.fail('Error running test');
        } else {
          assert.equal(res.status, 200);
          // Check that we redirected to the thread page
          assert.include(res.text, `h1 id='threadTitle'`);
        }
        done();
      });
  });

  test('Viewing a single thread with all replies: GET request to /api/replies/{board}', (done) => {
    const threadObjectKeys = ['_id', 'text', 'created_on', 'bumped_on', 'replies'];
    const replyObjectKeys = ['_id', 'text', 'created_on'];

    chai.request(server)
      .get(`/api/replies/${testBoard}`)
      .query({'thread_id': threadId})
      .end((err, res) => {
        if (err) {
          console.error(err);
          assert.fail('Error running test');
        } else {
          assert.equal(res.status, 200);
          assert.isObject(res.body, 'Response should be an object');
          assert.hasAllKeys(res.body, threadObjectKeys, 'Missing key(s) from thread object');
          assert.doesNotHaveAnyKeys(res.body, ['reported', 'delete_password']);
          assert.isArray(res.body['replies'], 'replies in not an array');
          assert.hasAllKeys(res.body['replies'][0], replyObjectKeys, 'Missing key(s) from reply object');
          assert.doesNotHaveAnyKeys(res.body['replies'][0], ['reported', 'delete_password']);
          replyId = res.body['replies'][0]['_id'];
        }
        done();
      });
  });

  test('Reporting a thread: PUT request to /api/threads/{board}', (done) => {
    chai.request(server)
      .put(`/api/threads/${testBoard}`)
      .send({
        'thread_id': threadId,
      })
      .end((err, res) => {
        if (err) {
          console.error(err);
          assert.fail('Error running test');
        } else {
          assert.equal(res.status, 200);
          assert.isString(res.text, 'Response should be a string');
          assert.equal(res.text, 'reported');
        }
        done();
      });
  });

  test('Reporting a reply: PUT request to /api/replies/{board}', (done) => {
    chai.request(server)
      .put(`/api/replies/${testBoard}`)
      .send({
        'thread_id': threadId,
        'reply_id': replyId,
      })
      .end((err, res) => {
        if (err) {
          console.error(err);
          assert.fail('Error running test');
        } else {
          assert.equal(res.status, 200);
          assert.isString(res.text, 'Response should be a string');
          assert.equal(res.text, 'reported');
        }
        done();
      });
  });

  test(
    'Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password',
    (done) => {
      chai.request(server)
        .delete(`/api/replies/${testBoard}`)
        .send({
          'thread_id': threadId,
          'reply_id': replyId,
          'delete_password': 'badpassword',
        })
        .end((err, res) => {
          if (err) {
            console.error(err);
            assert.fail('Error running test');
          } else {
            assert.equal(res.status, 200);
            assert.isString(res.text, 'Response should be a string');
            assert.equal(res.text, 'incorrect password');
          }
          done();
        });
    });

  test(
    'Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password',
    (done) => {
      chai.request(server)
        .delete(`/api/replies/${testBoard}`)
        .send({
          'thread_id': threadId,
          'reply_id': replyId,
          'delete_password': 'mypassword',
        })
        .end((err, res) => {
          if (err) {
            console.error(err);
            assert.fail('Error running test');
          } else {
            assert.equal(res.status, 200);
            assert.isString(res.text, 'Response should be a string');
            assert.equal(res.text, 'success');
          }
          done();
        });
    });

  test(
    'Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password',
    (done) => {
      chai.request(server)
        .delete(`/api/threads/${testBoard}`)
        .send({
          'thread_id': threadId,
          'delete_password': 'badpassword',
        })
        .end((err, res) => {
          if (err) {
            console.error(err);
            assert.fail('Error running test');
          } else {
            assert.equal(res.status, 200);
            assert.isString(res.text, 'Response should be a string');
            assert.equal(res.text, 'incorrect password');
          }
          done();
        });
    });

  test(
    'Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password',
    (done) => {
      chai.request(server)
        .delete(`/api/threads/${testBoard}`)
        .send({
          'thread_id': threadId,
          'delete_password': 'mypassword',
        })
        .end((err, res) => {
          if (err) {
            console.error(err);
            assert.fail('Error running test');
          } else {
            assert.equal(res.status, 200);
            assert.isString(res.text, 'Response should be a string');
            assert.equal(res.text, 'success');
          }
          done();
        });
    });

});
