/*\
title: $:/plugins/vsivsi/meteor/blaze
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
	var data = this.getAttribute("data",this.parseTreeNode.data || "");
	var domNode = this.document.createElement("div");
	domNode.setAttribute("class","blaze-widget");
	parent.insertBefore(domNode,nextSibling);
	if (Blaze.isTemplate(Template[name])) {
		if (data) {
			var dataObj = null
			try {
				// Try to make it an object from JSON
				dataObj = JSON.parse(data);
			} catch (e) {
				dataObj = { data: data };
			}
			this.view = Blaze.renderWithData(Template[name], dataObj, domNode);
		} else {
			this.view = Blaze.render(Template[name], domNode);
		}
	} else {
		console.warn("No Blaze template named",name,"was found");
	}
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
BlazeWidget.prototype.execute = function() {
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
	if (this.view) {
  	Blaze.remove(this.view);
	}
}

exports.blaze = BlazeWidget;

})();
