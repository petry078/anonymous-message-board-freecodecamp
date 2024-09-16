const Database = require('../database/database-mongo');

const db = new Database({'uri': process.env.DB});

class ReplyHandler {

  viewThreadReplies(req, res) {
    const messageBoard = req.params['board'].trim().toLowerCase();
    const threadId = req.query['thread_id'];
    db.listThread(messageBoard, threadId)
      .then((data) => {
        res.json(data);
      })
      .catch(err => {
        res.json({error: err});
      });
  };

  createReply(req, res) {
    const messageBoard = req.params['board'].trim().toLowerCase();
    const threadId = req.body['thread_id'];
    const text = req.body['text'];
    const deletePassword = req.body['delete_password'];
    db.createReply(messageBoard, threadId, text, deletePassword)
      .then(() => {
        res.redirect(`/b/${encodeURIComponent(messageBoard)}/${threadId}`);
      })
      .catch(err => {
        res.json({'error': err});
      });
  };

  reportReply(req, res) {
    const messageBoard = req.params['board'].trim().toLowerCase();
    const threadId = req.body['thread_id'];
    const replyId = req.body['reply_id'];
    db.reportReply(messageBoard, threadId, replyId)
      .then((response) => {
        res.send(response);
      })
      .catch(err => {
        res.send(err);
      });
  };

  deleteReply(req, res) {
    const board = req.params['board'].trim().toLowerCase();
    const threadId = req.body['thread_id'];
    const replyid = req.body['reply_id'];
    const deletePassword = req.body['delete_password'];
    db.deleteReply(board, threadId, replyid, deletePassword)
      .then(result => {
        res.send(result);
      })
      .catch(err => {
        res.send(err);
      });
  };
}

module.exports = ReplyHandler;