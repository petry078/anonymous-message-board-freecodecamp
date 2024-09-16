'use strict';
require('dotenv').config();
const https = require('https');
const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Log all requests
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`${Date.now()}: ${req.method} ${req.path} - ${req.ip}`);
  }
  next();
});

// Commented out options use helmet defaults.
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      'default-src': ['\'self\''],
      'base-uri': ['\'self\''],
      'block-all-mixed-content': [],
      'font-src': ['\'self\'', 'https:'],
      'frame-ancestors': ['\'self\''],
      'img-src': ['\'self\'', 'cdn.freecodecamp.org'],
      'object-src': ['\'none\''],
      'script-src': ['\'self\'', 'code.jquery.com', '\'unsafe-inline\''],
      'style-src': ['\'self\'', 'https:', '\'unsafe-inline\''],
      'upgrade-insecure-requests': [],
    },
  },
  // expectCt: false,
  referrerPolicy: {policy: 'same-origin'},
  // hsts: false,
  // hsts: {maxAge: 7776000},
  // noSniff: false,
  dnsPrefetchControl: {allow: false},
  // ieNoOpen: false,
  frameguard: {action: 'SAMEORIGIN'},
  // permittedCrossDomainPolicies: false,
  // hidePoweredBy: false,
  // xssFilter: false,
};
app.use(helmet(helmetConfig));

//Sample front-end
app.route('/b/:board/')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);

//404 Not Found Middleware
app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Setup server and use SSL if enabled
let server;
let PORT;
if (!!process.env.ENABLE_SSL) {
  const certOptions = {
    key: fs.readFileSync(path.resolve('certs/server.key')),
    cert: fs.readFileSync(path.resolve('certs/server.crt')),
  };

  server = https.createServer(certOptions, app);
  PORT = process.env.PORT || 8443;
} else {
  server = app;
  PORT = process.env.PORT || 3000;
}

//Start our server and tests!
const listener = server.listen(PORT, () => {
  console.log(`Listening on port ${listener.address().port}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (e) {
        const error = e;
        console.log('Tests are not valid:');
        console.log(error);
      }
    }, 1500);
  }
});

module.exports = app; //for testing
