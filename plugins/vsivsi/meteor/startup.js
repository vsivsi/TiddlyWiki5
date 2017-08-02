/*\
title: $:/plugins/vsivsi/meteor/startup.js
type: application/javascript

Meteor client code to launch TiddlyWiki5

\*/

Meteor.startup(function () {

  allTiddlers = Meteor.subscribe('allTiddlers');

  // Tracker.autorun(function (c) {
  //   if (allTiddlers.ready()) {
  //     Meteor.setTimeout(function () {
  //       // Escape the enclosing autorun
        var $tw = _bootprefix();
        // $tw.collection = new Mongo.Collection("tiddlers");
        // $tw.boot.suppressBoot = true;
        console.log("TW:", $tw);
         _boot($tw);
  //     },0);
  //     c.stop()
  //   }
  // });
});
