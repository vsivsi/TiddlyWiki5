/*\
title: $:/plugins/vsivsi/meteor/startup.js
type: application/javascript

Meteor client code to launch TiddlyWiki5

\*/

Meteor.startup(function () {

  sub = Meteor.subscribe('allTiddlers');

  Tracker.autorun(function (c) {
    if (sub.ready()) {
      var $tw = _bootprefix();
      // $tw.boot.suppressBoot = true;
      console.log("TW:", $tw);
       _boot($tw);
      c.stop()
    }
  });
});
