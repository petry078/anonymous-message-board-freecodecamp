const DatabaseInterface = require('./database-interface');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;

class DatabaseMongo extends DatabaseInterface {
  client = null;
  collection = null;

  // props:
  //    uri (mandatory): uri string to connect to MongoDB
  //    db (optional): name of the database. Default: messageboard
  //    collection (optional): name of the collection. Default: threads
  constructor(props = {}) {
    const db = 'messageboard';
    const collection = 'threads';

    super(props);

    // Connect to the provided URI
    if (props.hasOwnProperty('uri')) {
      this.client = new MongoClient(props['uri'], {useNewUrlParser: true, useUnifiedTopology: true});
      this.client.connect()
        .then(() => {
          this.collection = this.client
            .db(props.hasOwnProperty('db') ? props['db'] : db)
            .collection(props.hasOwnProperty('collection') ? props['collection'] : collection);
        })
        .catch(err => {
          throw err;
        });
    } else {
      throw new Error('No DB URI provided');
    }
  }

  createThread(board, text, deletePassword) {
    return new Promise((resolve, reject) => {
      this.collection.insertOne({
        'board': board,
        'text': text,
        'created_on': new Date(),
        'bumped_on': new Date(),
        'reported': false,
        'delete_password': deletePassword,
        'replies': [],
      })
        .then(() => {
          resolve('success');
        })
        .catch(err => {
          console.error(err);
          reject(err.toString());
        });
    });
  }

  createReply(board, threadId, text, deletePassword) {
    return new Promise((resolve, reject) => {
      const query = {'board': board, '_id': new ObjectId(threadId)};
      const reply = {
        '_id': new ObjectId(),
        'text': text,
        'created_on': new Date(),
        'reported': false,
        'delete_password': deletePassword,
      };
      const update = {
        $set: {'bumped_on': new Date()},
        $push: {
          replies: {
            $each: [reply],
            $sort: {'created_on': -1},
          },
        },
      };
      this.collection.updateOne(query, update)
        .then(() => {
          resolve('success');
        })
        .catch(err => {
          console.error(err);
          reject(err.toString());
        });
    });
  }

// Read

// Returns 10 most recent threads (order by bumped_on date) with the three most recent replies,
// do not send reported or delete_password
//
  listAllThreads(board) {
    return new Promise((resolve, reject) => {
      const query = {'board': board};
      const options = {
        'sort': {
          'bumped_on': -1,
        },
        'limit': 10,
      };
      this.collection.find(query, options).toArray()
        .then(data => {
          data = data.map(thread => {
            thread['replycount'] = thread['replies'].length;
            if (thread['replycount'] > 3) {
              thread['replies'] = thread['replies'].slice(0, 3);
            }
            thread['replies'] = thread['replies'].map(reply => {
              delete reply['reported'];
              delete reply['delete_password'];
              return reply;
            });
            delete thread['board'];
            delete thread['reported'];
            delete thread['delete_password'];
            return thread;
          });
          resolve(data);
        })
        .catch(err => {
          console.error(err);
          reject(err.toString());
        });
    });
  }

// Return a thread with all replies
  listThread(board, threadId) {
    return new Promise((resolve, reject) => {
      const query = {'board': board, '_id': new ObjectId(threadId)};
      this.collection.findOne(query)
        .then(thread => {
          delete thread['board'];
          delete thread['reported'];
          delete thread['delete_password'];
          thread['replies'] = thread['replies'].map(reply => {
            delete reply['reported'];
            delete reply['delete_password'];
            return reply;
          });
          resolve(thread);
        })
        .catch(err => {
          console.error(err);
          reject(err.toString());
        });
    });
  }

// Update

// report a thread, set reported to true, return 'success'
  reportThread(board, threadId) {
    return new Promise((resolve, reject) => {
      const query = {'board': board, '_id': new ObjectId(threadId)};
      const update = {
        $set: {'reported': true},
      };
      this.collection.updateOne(query, update)
        .then(() => {
          resolve('reported');
        })
        .catch(err => {
          console.error(err);
          reject(err.toString());
        });
    });
  }

// report a reply, set reported to true, return 'success'
  reportReply(board, threadId, replyId) {
    return new Promise((resolve, reject) => {
      const query = {'board': board, '_id': new ObjectId(threadId), 'replies._id': new ObjectId(replyId)};
      const update = {
        $set: {'replies.$.reported': true},
      };
      this.collection.updateOne(query, update)
        .then(() => {
          resolve('reported');
        })
        .catch(err => {
          console.error(err);
          reject(err.toString());
        });
    });
  }

// Delete

// delete a thread using delete_password, return 'success' or 'incorrect password'
  deleteThread(board, threadId, deletePassword) {
    return new Promise((resolve, reject) => {
      const query = {
        'board': board,
        '_id': new ObjectId(threadId),
        'delete_password': deletePassword,
      };
      this.collection.findOneAndDelete(query)
        .then((data) => {
          if (!!data.value) {
            resolve('success');
          } else {
            resolve('incorrect password');
          }
        })
        .catch(err => {
          console.error(err);
          reject(err.toString());
        });
    });
  }

// delete a reply using delete_password, set text to '[deleted]', return 'success' or 'incorrect password'
  deleteReply(board, threadId, replyId, deletePassword) {
    return new Promise((resolve, reject) => {
      const query = {
        'board': board,
        '_id': new ObjectId(threadId),
        'replies': {$elemMatch: {'_id': new ObjectId(replyId), 'delete_password': deletePassword}},
      };
      const update = {
        $set: {'replies.$.text': '[deleted]'},
      };
      this.collection.updateOne(query, update)
        .then((data) => {
          if (data.modifiedCount === 1) {
            resolve('success');
          } else {
            resolve('incorrect password');
          }
        })
        .catch(err => {
          console.error(err);
          reject(err.toString());
        });
    });
  }
}

module.exports = DatabaseMongo;