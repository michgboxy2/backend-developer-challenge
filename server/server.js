const express = require("express"),
      bps      = require('body-parser'),
      cors    = require('cors'),
      app     = express();

const api     = require("../api/api");

app.use(cors());
app.use(bps.json());
app.use(bps.urlencoded({ extended: false  }));

app.use("/api/v1", api);

app.use((err, req, res, next) => {
  
  return res.status(500).json(err);
  next();
});

module.exports = app;
