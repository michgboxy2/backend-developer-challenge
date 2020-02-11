const app = require('./server/server');
const express = require('express');
const PORT = process.env.PORT || 3000;

    app.use(express.static(__dirname + '/build'));

      app.listen(PORT, () => {
        console.log(`server started at ${PORT}`);
      });