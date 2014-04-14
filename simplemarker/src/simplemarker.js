
/**
 * SimpleMarker
 * Version 2.1
 *
 * @author kaktus621@gmail.com (Martin Matysiak)
 * @fileoverview A lightweight marker class, based on the lightweight
 * marker sample by google but trimmed down to my needs even more.
 */

/**
 * @license Copyright 2011 Martin Matysiak.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * SimpleMarkerOptions
 *
 * {google.maps.Point} anchor The point (in pixels) to which objects will snap.
 * {string} className The class name which will be assigned to the
 *    created div node.
 * {string} icon URL to an image file that shall be used.
 * {string} id A unique identifier that will be assigned to the
 *    created div-node.
 * {google.maps.Map} map Map on which to display Marker.
 * {google.maps.LatLng} position Marker position. Required.
 * {google.maps.Size} size The size of the marker in pixels.
 * {string} title Rollover text.
 * {boolean} visible If true, the marker is visible.
 */



/**
 * Constructor of the marker.
 *
 * @constructor
 * @extends {google.maps.OverlayView}
 * @param {?SimpleMarkerOptions} opts A set of parameters to customize the
 *    marker.
 */
var SimpleMarker = function(opts) {
  opts = opts || {};

  /** @private @type {google.maps.Point} */
  this.anchor_ = opts.anchor || new google.maps.Point(16, 16);

  /** @private @type {Array.<google.maps.LatLngBounds>} */
  this.bounds_ = [];

  /** @private @type {?string} */
  this.className_ = opts.className || null;

  /** @private @type {?string} */
  this.icon_ = opts.icon || null;

  /** @private @type {?string} */
  this.id_ = opts.id || null;

  /** @private @type {?google.maps.Map} */
  this.map_ = opts.map || null;

  /** @private @ŧype {?HTMLDivElement} */
  this.marker_ = null;

  /** @private @type {google.maps.LatLng} */
  this.position_ = opts.position || new google.maps.LatLng(0, 0);

  /** @private @type {google.maps.Size} */
  this.size_ = opts.size || new google.maps.Size(32, 32);

  /** @private @type {string} */
  this.title_ = opts.title || '';

  /** @private @type {boolean} */
  this.visible_ = opts.visible || true;

  // At last, call some methods which use the initialized parameters
  this.setMap(this.map_);
};

SimpleMarker.prototype = new google.maps.OverlayView();


/** @override */
SimpleMarker.prototype.onAdd = function() {
  var self = this;
  var marker = document.createElement('div');

  // Basic style attributes for every marker
  marker.style.position = 'absolute';
  marker.style.cursor = 'pointer';
  marker.style.width = this.size_.width + 'px';
  marker.style.height = this.size_.height + 'px';
  marker.style.display = this.visible_ ? 'block' : 'none';

  // Set other css attributes based on the given parameters
  if (this.id_) { marker.id = this.id_; }
  if (this.className_) { marker.className = this.className_; }
  if (this.title_) { marker.title = this.title_; }
  if (this.icon_) { marker.style.backgroundImage = 'url(' + this.icon_ + ')'; }

  // If neither icon, class nor id is specified, assign the basic google maps
  // marker image to the marker (otherwise it will be invisble)
  if (!(this.id_ || this.className_ || this.icon_)) {
    marker.style.backgroundImage = 'url(https://www.google.com/intl/en_us/' +
        'mapfiles/ms/micons/red-dot.png)';
  }

  // Add marker onto the map
  this.getPanes().overlayImage.appendChild(marker);

  this.marker_ = marker;

  // make clicks possible
  var trigger = function(ev) {
    google.maps.event.trigger(self, 'click');

    // don't let the event bubble up
    ev.cancelBubble = true;
    if (ev.stopPropagation) { ev.stopPropagation(); }
  }

  if (marker.attachEvent) { // IE :-/
    marker.attachEvent('onclick', trigger);
  } else {
    marker.addEventListener('click', trigger, false);
  }
};


/** @override */
SimpleMarker.prototype.onRemove = function() {
  this.marker_.parentNode.removeChild(this.marker_);
  this.marker_ = null;
};


/** @override */
SimpleMarker.prototype.draw = function() {
  var proj = this.getProjection();

  var divPx = proj.fromLatLngToDivPixel(this.position_);

  this.marker_.style.left = (divPx.x - this.anchor_.x) + 'px';
  this.marker_.style.top = (divPx.y - this.anchor_.y) + 'px';
};


//// Getter ////


/** @return {google.maps.Point} The marker's anchor. */
SimpleMarker.prototype.getAnchor = function() { return this.anchor_; };


/**
 * This method returns the bounds of our marker in latitude and longitude
 * values, based on the current or given zoom value of the map. You can use
 * these bounds for a clustering algorithm, as you can now easily check if a
 * LatLng-coordinate is inside the marker's bounds (i.e. the two objects
 * overlap) or not.
 *
 * @param {?number} zoom A zoom value for which you want to calculate the
 *    bounds of your marker. If not set, the current zoom value of the map
 *    will be taken.
 * @return {google.maps.LatLngBounds} The marker's bounds on the map.
 */
SimpleMarker.prototype.getBounds = function(zoom) {
  if (!zoom) {
    if (!this.map_) {
      throw 'Can\'t calculate bounds without a map specified';
    }

    zoom = this.map_.getZoom();
  }

  if (!this.bounds_[zoom]) {
    var convRatio = SimpleMarker.getLatLngPerPixel(zoom);

    this.bounds_[zoom] = new google.maps.LatLngBounds(
        new google.maps.LatLng(
          this.position_.lat() + convRatio.lat() *
          (this.anchor_.y - this.size_.height),
          this.position_.lng() - convRatio.lng() * this.anchor_.x
        ),
        new google.maps.LatLng(
          this.position_.lat() + convRatio.lat() * this.anchor_.y,
          this.position_.lng() - convRatio.lng() *
          (this.anchor_.x - this.size_.width)
        ));
  }

  return this.bounds_[zoom];
};


/** @return {string} The className or null if not set upon marker creation. */
SimpleMarker.prototype.getClassName = function() { return this.className_; };


/** @return {string} The current icon, if any. */
SimpleMarker.prototype.getIcon = function() { return this.icon_; };


/** @return {string} The identifier or null if not set upon marker creation. */
SimpleMarker.prototype.getId = function() { return this.id_; };


/** @return {google.maps.LatLng} The marker's current position. */
SimpleMarker.prototype.getPosition = function() { return this.position_; };


/** @return {google.maps.Size} The marker's size. */
SimpleMarker.prototype.getSize = function() { return this.size_; };


/** @return {string} The marker's rollover text. */
SimpleMarker.prototype.getTitle = function() { return this.title_; };


/** @return {boolean} Whether the marker is currently visible. */
SimpleMarker.prototype.getVisible = function() { return this.visible_; };


//// Setter ////


/** @param {google.maps.Point} anchor The marker's new anchor. */
SimpleMarker.prototype.setAnchor = function(anchor) {
  this.anchor_ = anchor;
  this.draw();
};


/** @param {string} className The new className. */
SimpleMarker.prototype.setClassName = function(className) {
  this.className_ = className;
  if (!!this.marker_) {
    this.marker_.className = className;
  }
};


/** @param {?string} icon URL to a new icon, or null in order to remove it. */
SimpleMarker.prototype.setIcon = function(icon) {
  this.icon_ = icon;
  if (!!this.marker_) {
    this.marker_.style.backgroundImage = !!icon ? 'url(' + icon + ')' : '';
  }
};


/** @param {string} id The new id. */
SimpleMarker.prototype.setId = function(id) {
  this.id_ = id;
  if (!!this.marker_) {
    this.marker_.id = id;
  }
};


/** @param {google.maps.StreetViewPov} position The desired position. */
SimpleMarker.prototype.setPosition = function(position) {
  this.position_ = position;
  this.bounds_ = []; // cached bounds become invalid with a new position
  this.draw();
};


/** @param {google.maps.Size} size The new size. */
SimpleMarker.prototype.setSize = function(size) {
  this.size_ = size;
  if (!!this.marker_) {
    this.marker_.style.width = size.width + 'px';
    this.marker_.style.height = size.height + 'px';
    this.draw();
  }
};


/** @param {string} title The new rollover text. */
SimpleMarker.prototype.setTitle = function(title) {
  this.title_ = title;
  if (!!this.marker_) {
    this.marker_.title = title;
  }
};


/** @param {boolean} show Whether the marker shall be visible. */
SimpleMarker.prototype.setVisible = function(show) {
  this.visible_ = show;
  if (!!this.marker_) {
    this.marker_.style.display = show ? 'block' : 'none';
  }
};


/**
 * Calculates the Latitude/Longitude per pixel ratio based on the given zoom.
 *
 * @param {number} zoom The zoom value for which you want to know the
 *    conversion ratio from pixel to LatLng.
 * @return {google.maps.LatLng} An object containing the latitudal and
 *    longitudal conversion ratio for a pixel.
 */
SimpleMarker.getLatLngPerPixel = function(zoom) {
  //256 is the Map Width (px) on zoom = 0
  var lng = 360 / (256 * (Math.pow(2, zoom)));
  var lat = 2 * lng / Math.PI;

  return new google.maps.LatLng(lat, lng);
};
