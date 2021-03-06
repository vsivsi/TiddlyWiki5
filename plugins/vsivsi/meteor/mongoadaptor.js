/*\
title: $:/plugins/vsivsi/meteor/mongoadaptor.js
type: application/javascript
module-type: syncadaptor

A sync adaptor module for synchronising with the Meteor MongoDB instance
This version is implemented as a clent/server collection

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
// "use strict";

/*
Constructor(options)

Initialises a new adaptor instance.
Parameter	Description
options	See below

Options include:
    options.wiki: reference to wiki to use with this syncadaptor
*/

var _mongoSafe = function (twf) {
  var safe = {}
  Object.keys(twf).forEach(function (key) {
    var nk = key.replace(/[.]/g,":");
    safe[nk] = twf[key];
  });
  safe._id = safe.title
  delete safe.title
  return safe;
};

var _tiddlerSafe = function (twf) {
  var safe = {}
  Object.keys(twf).forEach(function (key) {
    var nk = key.replace(/[^a-z_\-]/g,".");
    safe[nk] = twf[key];
  });
  safe.title = safe._id
  delete safe._id
  return safe;
};

var _lookupTiddler = function (collection, title) {
  doc = collection.findOne({_id:title},{fields:{_id:1},reactive:false});
  if (doc) {
    return true;
  } else {
    return null;
  }
}

function MongoAdaptor(options) {
	var self = this;
  gorp = this;
  console.log("In MongoAdaptor constructor", this);
	this.wiki = options.wiki;
  if (typeof Mongo != 'undefined') {
    this.collection = new Mongo.Collection("tiddlers");
    this.collection.find({}).observe({
      added: function (doc) {
        // if ((!self.wiki.tiddlerExists(doc.title)) &&
        //     ((!doc["draft:title"])||(!doc["draft:of"]))) {
          console.warn("Added:", doc._id);
          self.wiki.addTiddler(_tiddlerSafe(doc));
        // }
      },
      changed: function (doc, oldDoc) {
        // if ((!doc["draft:title"])||(!doc["draft:of"])) {
          console.warn("Changed:", doc._id);
          self.wiki.addTiddler(_tiddlerSafe(doc));
        // }
      },
      removed: function (doc) {
        if (self.wiki.tiddlerExists(doc._id)) {
          console.warn("Removed:", doc._id);
          self.wiki.deleteTiddler(doc._id);
        }
      }
    });
  }
  // this.logger = new $tw.utils.Logger("Mongo");
}

/*
getStatus(callback)

Retrieves status information from the server. This method is optional.
Parameter    Description
==========================================
callback	   Callback function invoked with parameters err,isLoggedIn,username
*/

MongoAdaptor.prototype.getStatus = function(callback) {
  console.log("getStatus called!");
  callback(null,false,null);
}

/*
getTiddlerInfo(tiddler)

Gets the supplemental information that the adaptor needs to keep track of for a particular tiddler. For example, the TiddlyWeb adaptor includes a bag field indicating the original bag of the tiddler.

  Parameter	      Description
=====================================
  tiddler	        Target tiddler

Returns an object storing any additional information required by the adaptor.
*/

MongoAdaptor.prototype.getTiddlerInfo = function(tiddler) {
  var self = this;
  console.log("Get info! Tiddler", tiddler);
  var exists = _lookupTiddler(self.collection, tiddler);
  if (exists) {
    console.log("Found tiddler", tiddler.fields.title);
    return {};
  } else {
    console.log("Not Found");
    return null;
  }
};

// Not sure what these are for...

// $tw.config.typeInfo = {
// 	"text/vnd.tiddlywiki": {
// 		fileType: "application/x-tiddler",
// 		extension: ".tid"
// 	},
// 	"image/jpeg" : {
// 		hasMetaFile: true
// 	}
// };
//
// $tw.config.typeTemplates = {
// 	"application/x-tiddler": "$:/core/templates/tid-tiddler"
// };

/*
Transliterate string from cyrillic russian to latin
*/
//  var transliterate = function(cyrillyc) {
// 	var a = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z","х":"h","ъ":"'","Ф":"F","Ы":"I","В":"V","А":"a","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"'","б":"b","ю":"yu"};
// 	return cyrillyc.split("").map(function (char) {
// 		return a[char] || char;
// 	}).join("");
// };

/*
getSkinnyTiddlers(callback)

Retrieves a list of skinny tiddlers from the server.

This method is optional. If an adaptor doesn't implement it then synchronisation will be unidirectional from the TiddlyWiki store to the adaptor, but not the other way.

Parameter	    Description
======================================
callback	    Callback function invoked with parameter err,tiddlers, where tiddlers is an array of tiddler field objects
*/
MongoAdaptor.prototype.getSkinnyTiddlers = function(callback) {
  var self = this;
  docs = self.collection.find({},{fields:{text:0},reactive:false})
             .map(function (d) { return _tiddlerSafe(d); });
  console.log("Got ", docs.length,"skinny tiddlers!");
  // callback(null, docs);
  callback(null, []);
};

/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)

saveTiddler(tiddler,callback,tiddlerInfo)

Saves a tiddler to the server.

Parameter	    Description
================================
tiddler	      Tiddler to be saved
callback	    Callback function invoked with parameter err,adaptorInfo,revision
tiddlerInfo	  The tiddlerInfo maintained by the syncer for this tiddler
*/
MongoAdaptor.prototype.saveTiddler = function(tiddler, callback, tiddlerInfo) {
  var self = this;

  var twf = _mongoSafe(tiddler.fields);
  var title = tiddler.fields.title;
  console.log("Save! Tiddler/Info:", twf, tiddlerInfo);

  var exists = _lookupTiddler(self.collection, title);

  if (exists) {
    console.log("Updating!");
    delete twf._id
    self.collection.update(title, {$set:twf}, function(err, count) {
      if (count) {
        callback(null, {}, 0);
      } else if (err) {
         callback(err);
      } else {  // No update occurred
        console.error("Update failed for:", title);
        callback(new Error("Update failed for:", title));
      }
    });
  } else {
    console.log("Inserting!");
    self.collection.insert(twf, function(err, _id) {
      if (_id) {
        console.log("Inserted", _id);
        callback(err, {}, 0);
      } else {
        console.error("Insert failed for:", title);
        callback(err);
      }
    });
  }
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)

We don't need to implement loading for the file system adaptor, because all the tiddler files will have been loaded during the boot process.

loadTiddler(title,callback)

Loads a tiddler from the server.

Parameter	       Description
===============================================
title	           Title of tiddler to be retrieved
callback	       Callback function invoked with parameter err,tiddlerFields

*/
MongoAdaptor.prototype.loadTiddler = function(title, callback) {
  var self = this;
  console.log("Load! Title:", title);
  doc = self.collection.findOne(title,{reactive:false});
  if (doc) {
    callback(null, _mongoSafe(doc));
  } else {
    callback(null,null);
    // callback(new Error("Tiddler ", title, "not found!"));
  }
};

/*
Delete a tiddler and invoke the callback with (err)

deleteTiddler(title,callback,tiddlerInfo)

Delete a tiddler from the server.

Parameter	          Description
=========================================================
title	              Title of tiddler to be deleted
callback	          Callback function invoked with parameter err
tiddlerInfo	        The tiddlerInfo maintained by the syncer for this tiddler
*/
MongoAdaptor.prototype.deleteTiddler = function(title, callback, tiddlerInfo) {
	var self = this;
  var _finish = function(err) {
    callback(err);
  };
  console.log("Delete! Title/Info:", title, tiddlerInfo);
  var exists = _lookupTiddler(self.collection, title);

  if (exists) {
    self.collection.remove(title, _finish);
  } else {
    _finish(null);
    // _finish(new Error("deleteTiddler for:", title, "couldn't find document"));
  }
};

/*
Exports

The following properties should be exposed via the exports object:
Property	Description
adaptorClass	The JavaScript class for the adaptor

Nothing should be exported if the adaptor detects that it isn't capable of operating successfully (eg, because it only runs on either the browser or the server, or because a dependency is missing).
*/

if (typeof Mongo != 'undefined') {
  exports.adaptorClass = MongoAdaptor;
}

})();
