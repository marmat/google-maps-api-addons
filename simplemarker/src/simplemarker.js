
/**
 * SimpleMarker
 * Version 2.0
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
 * Please note that some parameters are required! If those are not specified,
 * an error will be thrown.
 *
 * {google.maps.Map} map Map on which to display Marker.
 * {google.maps.LatLng} position Marker position. Required.
 * {string} id A unique identifier that will be assigned to the
 *    created div-node.
 * {string} className The class name which will be assigned to the
 *    created div node.
 * {string} icon URL to an image file that shall be used.
 * {string} title Rollover text.
 * {boolean} visible If true, the marker is visible.
 * {google.maps.Size} size The size of the marker in pixels.
 * {google.maps.Point} anchor The point (in pixels) to which objects will snap.
 */



/**
 * Constructor of the marker.
 *
 * @constructor
 * @extends {google.maps.OverlayView}
 * @param {SimpleMarkerOptions} opts A set of parameters to customize the
 *    marker.
 */
var SimpleMarker = function(opts) {

  /** @private @type {?google.maps.Map} */
  this.map_ = null;

  /** @private @ŧype {?HTMLDivElement} */
  this.marker_ = null;

  /** @private @type {?string} */
  this.id_ = null;

  /** @private @type {?string} */
  this.class_ = null;

  /** @private @type {?string} */
  this.icon_ = null;

  /** @private @type {?string} */
  this.title_ = null;

  /** @private @type {boolean} */
  this.visible_ = true;

  /** @private @type {google.maps.Size} */
  this.size_ = new google.maps.Size(32, 32);

  /** @private @type {google.maps.Point} */
  this.anchor_ = new google.maps.Point(16, 16);

  /** @private @type {Array.<google.maps.LatLngBounds>} */
  this.bounds_ = [];


  // Set required parameters
  if (SimpleMarker.isUndefined(opts)) {
    throw 'No parameters specified. Please specify at least the required ones.';
  }

  if (SimpleMarker.isUndefined(opts.position)) {
    throw 'Required parameter \'position\' is missing.';
  }

  /** @private @type {google.maps.LatLng} */
  this.position_ = opts.position;


  // Now merge the optional parameters
  if (!SimpleMarker.isUndefined(opts.map)) {
    this.map_ = opts.map;
  }

  if (!SimpleMarker.isUndefined(opts.id)) {
    this.id_ = opts.id;
  }

  if (!SimpleMarker.isUndefined(opts.className)) {
    this.class_ = opts.className;
  }

  if (!SimpleMarker.isUndefined(opts.icon)) {
    this.icon_ = opts.icon;
  }

  if (!SimpleMarker.isUndefined(opts.title)) {
    this.title_ = opts.title;
  }

  if (!SimpleMarker.isUndefined(opts.visible)) {
    this.visible_ = opts.visible;
  }

  if (!SimpleMarker.isUndefined(opts.size)) {
    this.size_ = opts.size;
  }

  if (!SimpleMarker.isUndefined(opts.anchor)) {
    this.anchor_ = opts.anchor;
  }

  if (!SimpleMarker.isUndefined(opts.bounds)) {
    this.bounds_ = opts.bounds;
  }

  // At last, call some methods which use the initialized parameters
  this.setVisible(this.visible_);
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
  if (this.class_) { marker.className = this.class_; }
  if (this.title_) { marker.title = this.title_; }
  if (this.icon_) { marker.style.backgroundImage = 'url(' + this.icon_ + ')'; }

  // If neither icon, class nor id is specified, assign the basic google maps
  // marker image to the marker (otherwise it will be invisble)
  if (!(this.id_ || this.class_ || this.icon_)) {
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


/**
 * Getter for .position_
 * @return {google.maps.LatLng} An object representing the current position.
 */
SimpleMarker.prototype.getPosition = function() { return this.position_; };


/**
 * Method for repositioning the marker. The change will be drawn immediatly
 *
 * @param {google.maps.LatLng} position A google.maps.LatLng object with
 * the desired position.
 */
SimpleMarker.prototype.setPosition = function(position) {
  this.position_ = position;
  // Clear the bounds cache as the bounds are false when the position changes
  this.bounds_ = [];
  // Redraw the marker
  this.draw();
};


/**
 * Method for obtaining the Identifier of the marker
 *
 * @return {string} The identifier or null if not set upon marker creation.
*/
SimpleMarker.prototype.getId = function() {
  return this.id_;
};


/**
 * This method returns the bounds of our marker in latitude
 * and longitude values, based on the current or given zoom
 * value of the map.
 * You can use these bounds for a clustering algorithm, as you
 * can now easily check if a LatLng-coordinate is inside the
 * marker's bounds (i.e. the two objects overlap) or not.
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
        )
        );
  }

  return this.bounds_[zoom];
};


/**
 * Getter for .title_
 * @return {?string} If set, the marker's rollover text, otherwise an empty
 *    string.
 */
SimpleMarker.prototype.getTitle = function() {
  return this.title_ ? this.title_ : '';
};


/**
 * Setter for .title_
 * @param {string} title the new rollover text.
 */
SimpleMarker.prototype.setTitle = function(title) {
  if (this.marker_) {
    this.marker_.title = title;
  }

  this.title_ = title;
};


/**
 * Getter for .visible_
 * @return {boolean} true if the marker is set to being visible, else false.
 */
SimpleMarker.prototype.getVisible = function() {
  return this.visible_;
};


/**
 * Setter for .visible_
 * @param {boolean} show true if marker shall be shown, else false.
 */
SimpleMarker.prototype.setVisible = function(show) {
  if (this.marker_) {
    this.marker_.style.display = show ? 'block' : 'none';
  }

  this.visible_ = show;
};


/**
 * Static helper method which calculates the Latitude/Longitude per pixel ratio
 * based on the given zoom.
 *
 * If you want to speed up things, you might replace the formula by an array
 * of constant LatLng values, as the ratio isn't depending on any factors but
 * the map's scaling. If this should change in the future, you would have
 * to adjust the formula either way.
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


/**
 * Static helper method which checks whether the given element is undefined
 * or not. Using the typeof command in combination with a string comparison
 * is the best way to do that.
 *
 * @param {?Object} object The object which shall be checked.
 * @return {boolean} True if the object is defined, otherwise false.
 */
SimpleMarker.isUndefined = function(object) {
  return typeof object === 'undefined';
};
