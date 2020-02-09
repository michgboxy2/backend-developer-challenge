const express = require('express'),
      api     = express.Router(),
      disbursementRouter = require('./v1/disbursementRouter');


      api.use('/disburse', disbursementRouter);



      module.exports = api;