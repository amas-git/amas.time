var express = require('express');
var http = require('http');
var app = express();
var bodyParser = require('body-parser');


app.set('title', 'Hello Socket.io');
app.set('port', process.env.PORT || 3000);
app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');



app.use(bodyParser());
app.get('/', function (req, res) {
  res.render('index', { title: 'Hi', message: 'Hello Socket.io' })
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});