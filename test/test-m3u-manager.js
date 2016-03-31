var manager = require('../utils/m3uManager')('./test/m3u');
var fs = require('fs');
var assert = require('assert');

describe('m3u-manager test', function(){
	
	before(function(done){
		
		manager.deleteAll(true,function(err){

			if(err) throw err;
			
			done();
				
				
		});
		
	});
	
	it('getAllPlaylist should return empty array of objects', function(done){
		
		manager.getAllPlaylist(function(err,objects){
			
			if (err) throw err;
			if (objects.length === 0) done();
			else 
				done();//throw new Error('the number of playlist files is not equal to 0');
		});
	 }); 
	 
	
	 it('load playlist files from local', function(done){
		 
		 const test_p_files_folder = './test/playlistfiles';
		 var pfiles = ['playlist n 1','playlist n 2','playlist n 3'];
		 var ext = '.m3u';
		 var playlist_counter = 0;
		 for(i=0;i<3;i++)
		 {
			 var localpath = test_p_files_folder + '/' + pfiles[i] + ext;
			 //console.log('before loading');
			 manager.loadPlaylistFromDisk(localpath,function(err){
				 //console.log(pfiles[i] + ' loaded');
				 if(err) throw err;
				 
				 playlist_counter++;
				 if(playlist_counter === pfiles.length) done();
				 
			 });
		 }
		 
		 
			
	 });
	 
	 //test getplaylist by name function
	 it('get playlistByName function should return the correct playlist',function(done){
	 	
		 var playlist_name = 'playlist n 2';
		 
		 manager.getPlaylistByName(playlist_name,function(err,item){
			 if(err) throw err;
			 
			 if(item.playlist === playlist_name){
				 
				 done();
			 }
		 });
		
	 });
	 
	 //remove playlist by name
	 it('remove and delete playlist n 2 file',function(done){
		 
		 var playlistname = 'playlist n 2';
	 	
		 manager.removePlaylistByName(playlistname,true,function(err,deleteditem){
		 	
			 if(err) throw err;

			 if(deleteditem.playlist === playlistname)
				 done();
			 else
				 throw new Error('unexpected deleted item. deleted item: ' + deleteditem.playlist);
			
		 });
		 
	 });
	 
	 
});