'use strict';

const ThreadHandler = require('../controllers/thread');
const ReplyHandler = require('../controllers/reply');

const threadHandler = new ThreadHandler();
const replyHandler = new ReplyHandler();

module.exports = (app) => {

  app.route('/api/threads/:board')
    .get(threadHandler.viewThreads)
    .put(threadHandler.reportThread)
    .post(threadHandler.createThread)
    .delete(threadHandler.deleteThread);

  app.route('/api/replies/:board')
    .get(replyHandler.viewThreadReplies)
    .put(replyHandler.reportReply)
    .post(replyHandler.createReply)
    .delete(replyHandler.deleteReply);
};
