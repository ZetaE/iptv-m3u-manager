var fs = require('fs');
var M3Uparser = require('playlist-parser').M3U;
var async = require('async');
var Store = require('json-fs-store');
var debug = require('debug')('iptvplayer:m3u-manager');
var uuid = require('node-uuid');
var Path = require('path');
var http = require('http');
var mkdirp = require('mkdirp');

const M3U_PATH = './m3u';

var M3uManager = function(m3uPath){
	
	const m3upath = m3uPath || M3U_PATH;
	const PLAYLIST_FOLDER_PATH = m3upath + '/' + 'files/';

	mkdirp(PLAYLIST_FOLDER_PATH, function (err,made) {
	    if (err) throw err;
		console.log(made);
	});
	
	var store = Store(m3upath);
	
	debug('playlist files loaded from ' + m3upath);
	
	var m3uParser = function(path,cb){
		
		fs.readFile(path,'utf8',function(err,data){
			
			if(err) return cb(err);
			
			var playlist = M3Uparser.parse(data);
			var channels = [];
			var channel = null;
	
			playlist.forEach(function(ch){
				var rawtitle = ch.title;
				//delete the -1 from title
				if(rawtitle.indexOf("-1") == 0){
					rawtitle = rawtitle.slice(3);
					}
				channel = ch;
				channel.title = rawtitle;
				channel.favorite = false;
				channels.push(channel);
			});
	
			return cb(null,channels);
			
		});
		
		/*
		var playlist = M3Uparser.parse(fs.readFileSync(path, { encoding: "utf8" }));
		var channels = [];
		var channel = null;
	
		playlist.forEach(function(ch){
			var rawtitle = ch.title;
			//delete the -1 from title
			if(rawtitle.indexOf("-1") == 0){
				rawtitle = rawtitle.slice(3);
				}
			channel = ch;
			channel.title = rawtitle;
			channel.favorite = false;
			channels.push(channel);
		});
	
		return channels;
		*/
	};
	
	var asyncRemovePlaylist = function(playlist,removeFromDisk){
		
		return function(callback){
			
			store.remove(playlist.id,function(err){
				
				if(err) return callback(err);
				
				if(removeFromDisk){
					fs.unlink(playlist.path,function(err){
						
						if(err) return callback(err);
						
						callback(null);
					});
				}
				else
					callback(null);
			});
		}
	};
	
	var savePlaylist = function(path,cb){
		
		m3uParser(path,function(err,channels){
			
			var playlistname = Path.basename(path).replace(/\.[^/.]+$/, "");
			var id = uuid.v1();
	
			var obj = {
				id : id,
				playlist: playlistname ,
				path : path , 
				channels : channels
			};
	
			store.add(obj, function(err) {
	  	 
	  	  		if (err) return cb(err);
	  
	  			debug('playlist ' + obj.playlist + 'saved correctly');
	 
		  		return cb(null);
			});		
		});
	};
	
	return {
		
		deleteAll : function(removeFromDisk,cb){
			
			this.getAllPlaylist(function(err,objects){
				
				if(err) return cb(err);
				
				//no playlists found
				if(objects.length === 0) return cb(null);
				
				var async_task = [];
				
				objects.forEach(function(item){
					
					async_task.push(asyncRemovePlaylist(item,removeFromDisk));
					
				});
				
				async.parallel(async_task,function(err){
						
					if(err) return cb(err);
					
					cb(null);
						
				});
				
			});
				
		},
	
		getPlaylistByName : function(name,cb){
			
			this.getAllPlaylist(function(err,objects){

				if(err) return cb(err);
				
				var pl = objects.find(function(item){
							return item.playlist === name;
						});
			
				if(pl) 
					return cb(null,pl);
				else 
					return cb(new Error('playlist not found'));
		
				});	
		},	
	
		removePlaylistByName : function(name,removeFromDisk,cb){
		
			this.getAllPlaylist(function(err,objects){
				
				if(err) return cb(err);
				
				var fobj = objects.find(function(item){
					return item.playlist === name;
				});
				
				asyncRemovePlaylist(fobj,removeFromDisk)(function(err){
					
					if(err) return cb(err);
					
					cb(null,fobj);
					
				});
			});
		},
	
		getAllPlaylist : function(cb){
		
			store.list(function(err, objects) {
  		  	  // err if there was trouble reading the file system
		
  		  	  	if (err) return cb(err);
		  
		  		return cb(null,objects);
		  
	  		});
		
		},
	
		downloadPlaylist : function(url,cb){
		
			var self = this;
		
			//download the M3U playlist
			var request = http.get(url, function(response) {
			
				var filename;
				var attachment = response.headers['content-disposition'];
			
				if(attachment.indexOf('attachment; filename="') > -1){
				
					var pos = 'attachment; filename="'.length;
					filename = attachment.substr(pos).slice(0,-1);
				
				}
				else
					filename = uuid.v1() + '.m3u';
			
				var ppath = PLAYLIST_FOLDER_PATH + filename;
			
				var dest = fs.createWriteStream(ppath);
			
		  		response.pipe(dest).on('finish',function(){
				
		  			savePlaylist(ppath,function(err,path){
						
		  				if(err) return cb(err);
						
						debug('playlist downloaded');
						cb(null);
		  			});
		  		}); 	
				}).on('error',function(){
				
					cb(new Error('error in playlist downloading'));
				
			});
		},
		
		loadPlaylistFromDisk : function(localpath,cb){
			
			var destpath = PLAYLIST_FOLDER_PATH + Path.basename(localpath);
			
			//copy m3u playlist in the m3u files folder
			var self = this;
			var stream = fs.createReadStream(localpath).pipe(fs.createWriteStream(destpath))
				.on('finish',function(){
				
					savePlaylist(destpath,function(err){
						if(err) return cb(err);
						cb(null);
					
					});
				})
		}
		
	}
}

module.exports = M3uManager;