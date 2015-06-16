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
  return safe;
};

var _tiddlerSafe = function (twf) {
  var safe = {}
  Object.keys(twf).forEach(function (key) {
    var nk = key.replace(/[^a-z_\-]/g,".");
    safe[nk] = twf[key];
  });
  return safe;
};

var _lookupTiddler = function (collection, tiddler, tiddlerInfo) {
  if (tiddlerInfo && tiddlerInfo.adaptorInfo && tiddlerInfo.adaptorInfo._id) {
    return tiddlerInfo.adaptorInfo._id;
  } else {
    doc = collection.findOne({title:tiddler.fields.title},{fields:{_id:1},reactive:false});
    if (doc) {
      return doc._id;
    } else {
      return null;
    }
  }
}

function MongoAdaptor(options) {
	var self = this;
  gorp = this;
	this.wiki = options.wiki;
  if (typeof Mongo != 'undefined') {
    this.collection = new Mongo.Collection("tiddlers");
    this.subscription = Meteor.subscribe('allTiddlers');
	}
  // this.logger = new $tw.utils.Logger("Mongo");
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
  var _id = _lookupTiddler(self.collection, tiddler);
  if (_id) {
    return { _id: doc._id };
  } else {
    return {};
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
  Tracker.autorun(function (c) {
    if (self.subscription.ready()) {
      docs = self.collection.find({},{fields:{_id:0,text:0},reactive:false})
                 .map(function (d) { return _tiddlerSafe(d); });
      console.log("Got ", docs.length,"skinny tiddlers!");
      callback(null, docs);
      c.stop();
    }
  });
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

  console.log("Save! Tiddler/Info:", twf, tiddlerInfo);

  var _id = _lookupTiddler(self.collection, tiddler, tiddlerInfo);

  if (_id) {
    console.log("Updating!", _id);
    self.collection.update(_id, {$set:twf}, function(err, count) {
      if (count) {
        callback(null, { _id: _id }, 0);
      } else if (err) {
         callback(err);
      } else {  // No update occurred
        console.error("Update failed for id:", _id);
        callback(new Error("Update failed for id:", _id));
      }
    });
  } else {
    console.log("Inserting!");
    self.collection.insert(twf, function(err, _id) {
      console.log("Inserted", _id);
      callback(err, { _id: _id }, 0);
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
  doc = self.collection.findOne({title:title},{fields:{_id:0}, reactive:false});

  if (doc) {
    var twf = _mongoSafe(doc);
    callback(null, twf);
  } else {
    callback(new Error("Tiddler ", title, "not found!"));
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
  var _id = _lookupTiddler(self.collection, {fields:{title: title}}, tiddlerInfo);

  if (_id) {
    self.collection.remove(_id, _finish);
  } else {
    _finish(new Error("deleteTiddler for:", title, "couldn't find document"));
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
