// Database interface class

class DatabaseInterface {
  // Database schema from requirements
  // threads
  //      _id: id
  //      board_name: string 
  //      text: string
  //      created_on: date/time
  //      bumped_on: date/time
  //      reported: boolean
  //      delete_password: string
  //      replies: array of replies

  // replies
  //      _id: id
  //      text: string
  //      created_on: date/time
  //      delete_password: date/time
  //      reported: boolean

  constructor(props = {}) {
    // Use props as needed for specific database software
  }

  // Create

  // create a new thread with all fields
  createThread(board, text, delete_password) {}

  // create a reply to a thread with all fields
  createReply(board, thread_id, text, delete_password) {}

  // Read

  // Returns 10 most recent threads (order by bumped_on date) with the three most recent replies,
  // do not send reported or delete_password
  listAllThreads(board) {}

  // Return a thread with all replies
  listThread(board, thread_id) {}

  // Update

  // report a thread, set reported to true, return 'success'
  reportThread(board, thread_id) {}

  // report a reply, set reported to true, return 'success'
  reportReply(board, thread_id, reply_id) {}

  // Delete

  // delete a thread using delete_password, return 'success' or 'incorrect password'
  deleteThread(board, thread_id, delete_password) {}

  // delete a reply using delete_password, set text to '[deleted]', return 'success' or 'incorrect password'
  deleteReply(board, thread_id, reply_id, delete_password) {}
}

module.exports = DatabaseInterface;