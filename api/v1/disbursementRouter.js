const express = require('express'),
      router  = express.Router(),
      {handleUploads, currencyList}      = require('./disbursementController');



      router.route('/')
      .post(handleUploads)
      .get(currencyList);


      module.exports = router;