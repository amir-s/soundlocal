var request = require('request');
var eyed3 = require('eyed3');
var fs = require('fs');
var ffmetadata = require('ffmetadata');
var nodejszip = require('nodejs-zip');

var getJson = function (url, cb) {
	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			return cb(null, JSON.parse(body));
		}
		return cb(error || response.statusCode);
	});
}
var cid = '2412b70da476791567d496f0f3c26b88';

var download = function (url, cb) {
	var files = [];
	var r = 'http://api.soundcloud.com/resolve.json?url=' + url + '&client_id=' + cid;
	getJson(r, function (err, data) {
		if (err) throw err;
		var arc = data.title;
		var N = data.tracks.length;
		data.tracks.forEach(function (e) {
			var stream = request(e.stream_url+"?client_id=" + cid);
			var f = './songs/'+e.permalink+'.mp3';
			stream.on('end', function () {
				var options = {};
				var id3 = {};
				var cc = function () {
					
					var data = {
						description: e.description,
						title: e.title,
						genre: e.genre
					};

					ffmetadata.write(f, data, options, function(err) {
						if (err) throw err;
						console.log(f);
						files.push(f);
						if (files.length == N) {
							
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


						}
					});

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
							attachments: ['./img/def.jpg'],
						};
					cc();
				}
			});
			stream.pipe(fs.createWriteStream(f));
		});
	});
}

module.exports = download;