/*\
title: blaze
type: application/javascript
module-type: widget

Blaze widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var counter = 0;

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var BlazeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
BlazeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
BlazeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var name = this.getAttribute("name",this.parseTreeNode.name || "");
        var domNode = this.document.createElement("div");
        domNode.setAttribute("class","blaze-widget");
        parent.insertBefore(domNode,nextSibling);
        this.view = Blaze.render(Template[name], domNode);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
BlazeWidget.prototype.execute = function() {
   Session.set('count', Session.get('count')+1);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
BlazeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

/*
Implement a local destructor
*/
BlazeWidget.prototype.destructor = function() {
   console.log("Destroy everything!");
   Blaze.remove(this.view);
}

exports.blaze = BlazeWidget;

})();
