var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var downloader = require('./soundlocal');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
	res.render('index');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});





var http = require('http');
var port = process.env.PORT || '3000';

var server = http.createServer(app);

var io = require('socket.io')(server);

io.on('connection', function (socket) {
	
	socket.on('url', function (url) {
		downloader(url, function (list) {
			// console.log(list);
			socket.emit('list', list);
		}, function (name) {
			socket.emit('downloaded', name);
		}, function () {
			socket.emit('startzip');
		}, function (stat) {
			socket.emit('stat', stat);
		}, function (name) {
			socket.emit('fin', name+'.zip');
		}, function () {
			socket.emit('err');
		})
	});
});

server.listen(port);

