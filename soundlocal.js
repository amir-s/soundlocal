var request = require('request');
var fs = require('fs');
var ffmetadata = require('ffmetadata');
var nodejszip = require('nodejs-zip');

Array.prototype.forEachAsync = function (cb, end) {
	var _this = this;
	setTimeout(function () {
		var index = 0;
		function next() {
			index++;
			if (index >= _this.length) {
				if (end) end();
				return;
			}
			cb(_this[index], next);
		}
		if (_this.length == 0) {
			if (end) end();
		}else {
			cb(_this[0], next);
		}
	}, 0);
}



var getJson = function (url, cb) {
	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			return cb(null, JSON.parse(body));
		}
		return cb(error || response.statusCode);
	});
}
var cid = '2412b70da476791567d496f0f3c26b88';
var goo = function (arc, arr, cb) {
	var files = [];
	console.log("GOO");
	arr.forEachAsync(function (e, next) {
		console.log(e.file);
		ffmetadata.write(e.file, e.data, e.options, function(err) {
			if (err) throw err;
			files.push(e.file);
			next();
		});
	}, function () {
		var file = './public/' + arc + '.zip',
			arguments = ['-j'],
			fileList = files;

		var zip = new nodejszip();

		zip.compress(file, fileList, arguments, function(err) {
			if (err) {
				throw err;
			}
			cb(arc);
		});
	})
}
var download = function (url, lister, downloaded, startzip, cb) {
	var files = [];
	var r = 'http://api.soundcloud.com/resolve.json?url=' + url + '&client_id=' + cid;
	getJson(r, function (err, data) {
		var arr = [];
		if (err) throw err;
		var arc = data.title;
		var N = data.tracks.length;
		lister(data.tracks);
		data.tracks.forEach(function (e) {
			var stream = request(e.stream_url+"?client_id=" + cid);
			var f = './songs/'+e.permalink+'.mp3';
			stream.on('end', function () {

				var options = {};
				var id3 = {};
				var cc = function () {
					downloaded(e.permalink);
					var data = {
						description: e.description,
						title: e.title,
						genre: e.genre
					};
					arr.push({
						file: f,
						data: data,
						options: options
					});
					if (arr.length == N) {
						startzip();
						goo(arc, arr, cb);
					}
				}
				if (e.artwork_url) {
					var art = request(e.artwork_url);

					art.on('end', function () {
						options = {
							attachments: ['./img/'+e.permalink +'.jpg'],
						};
						cc();
					});
					art.pipe(fs.createWriteStream('./img/' + e.permalink + '.jpg'));
				}else {
					options = {
						attachments: ['./def.jpg'],
					};
					cc();
				}
			});
			stream.pipe(fs.createWriteStream(f));
		});
	});
}

module.exports = download;