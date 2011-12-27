
/**
 * SimpleMarker
 * Version 1.4
 *
 * @author kaktus621@gmail.com (Martin Matysiak)
 * @fileoverview A lightweight marker class, based on the lightweight
 * marker sample by google but trimmed down to my needs
 * even more.
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
 * Constructor of the marker.
 *
 * @constructor
 * @extends {google.maps.OverlayView}
 * @param {google.maps.Map} map the map where the marker will be shown.
 * @param {google.maps.LatLng} position the marker's position (google.maps.LatLng object).
 * @param {Object=} opts an array of options containting:
 *          id: A unique identifier. This will also be set as CSS id
 *          image: A String containing the path to an image that should be used,
 *            defaults to the basic red google maps marker icon
 *          dimension: google.maps.Size object, default 32x32
 *          anchor: google.maps.Point object (default Width/2, Height)
 *          classname: String object for a CSS class name. If set, the
 *            params image and dimension will be ignored, default null
 *          title: String object, default null.
 */
function SimpleMarker(map, position, opts) {
  this.map_ = map;
  this.position_ = position;
  this.bounds_ = new Array();

  // get options and apply defaults if not set
  if (!opts) {
    // if no options were given, create an empty set,
    // otherwise the next lines may break the script
    // in some browsers
    opts = {};
  }

  this.ID_ = opts.id ? opts.id : null;
  this.image_ = 'url(' + (opts.image ? opts.image : 'http://www.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png') + ')';
  this.dimension_ = opts.dimension ? opts.dimension : new google.maps.Size(32, 32);
  this.anchor_ = opts.anchor ? opts.anchor : new google.maps.Point(this.dimension_.width / 2, this.dimension_.height);
  this.classname_ = opts.classname ? opts.classname : '';
  this.title_ = opts.title ? opts.title : '';

  this.setMap(map);
}

SimpleMarker.prototype = new google.maps.OverlayView();

/**
 * Method will be called when the marker shall be displayed on the map
 * Overrides google.maps.OverlayView.onAdd()
 */
SimpleMarker.prototype.onAdd = function() {
  var self = this;
  var marker = document.createElement('div');

  // Basic style attributes for every marker
  marker.style.position = 'absolute';
  marker.style.cursor = 'pointer';

  // Set other css attributes based on the given parameters
  marker.id = this.ID_ ? this.ID_ : '';
  marker.className = this.classname_;
  marker.title = this.title_;
  marker.style.backgroundImage = this.image_;
  marker.style.width = this.dimension_.width + 'px';
  marker.style.height = this.dimension_.height + 'px';

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

/**
 * Method will be called when marker shall be removed from the map canvas
 * Overrides google.maps.OverlayView.onRemove()
 */
SimpleMarker.prototype.onRemove = function() {
  this.marker_.parentNode.removeChild(this.marker_);
  this.marker_ = null;
};

/**
 * Draws the marker onto the maps canvas.
 * Overrides google.maps.OverlayView.draw()
 */
SimpleMarker.prototype.draw = function() {
  var proj = this.getProjection();

  var divPx = proj.fromLatLngToDivPixel(this.position_);

  this.marker_.style.left = (divPx.x - this.anchor_.x) + 'px';
  this.marker_.style.top = (divPx.y - this.anchor_.y) + 'px';
};

/**
 * Method for obtaining the current position of the marker
 *
 * @retruns  A google.maps.LatLng object representing the current position
 */
SimpleMarker.prototype.getPosition = function() {
  return this.position_;
};

/**
 * Method for repositioning the marker. The change will be drawn immediatly
 *
 * @param position A google.maps.LatLng object with the desired position
 */
SimpleMarker.prototype.setPosition = function(position) {
  this.position_ = position;
  // Clear the bounds cache as the bounds are false when the position changes
  this.bounds_ = new Array();
  // Redraw the marker
  this.draw();
};

/**
 * Method for obtaining the Identifier of the marker
 *
 * @returns The identifier (string) or null if not set upon marker creation
*/
SimpleMarker.prototype.getID = function() {
  return this.ID_;
};

/**
 * This method returns the bounds of our marker in latitude
 * and longitude values, based on the current or given zoom
 * value of the map.
 * You can use these bounds for a clustering algorithm, as you
 * can now easily check if a LatLng-coordinate is inside the
 * marker's bounds (i.e. the two objects overlap) or not.
 *
 * @param zoom? A zoom value for which you want to calculate the
 *          bounds of your marker. If not set, the current
 *          zoom value of the map will be taken.
 */
SimpleMarker.prototype.getBounds = function(zoom) {
  if (!zoom) {
    zoom = this.map_.getZoom();
  }

  if (!this.bounds_[zoom]) {
    var convRatio = getLatLngPerPixel(zoom);

    this.bounds_[zoom] = new google.maps.LatLngBounds(
        new google.maps.LatLng(
        this.position_.lat() + convRatio.lat() * (this.anchor_.y - this.dimension_.height),
        this.position_.lng() - convRatio.lng() * this.anchor_.x
        ),
        new google.maps.LatLng(
        this.position_.lat() + convRatio.lat() * this.anchor_.y,
        this.position_.lng() - convRatio.lng() * (this.anchor_.x - this.dimension_.width)
        )
        );
  }

  return this.bounds_[zoom];
};

/**
 * Shows or hides the div node, without completely removing
 * it. Necessary method if you want to use MarkerManager!
 *
 * @param show true if marker shall be shown, else false
 */
SimpleMarker.prototype.setVisible = function(show) {
  if (this.marker_) {
    this.marker_.style.display = show ? 'block' : 'none';
  }
};

/**
 * Calculates the Latitude/Longitude per
 * Pixel ratio based on the given zoom.
 *
 * If you want to speed up things, you might
 * replace the formula by an array of constant
 * LatLng values, as the ratio isn't depending
 * on any factors but the map's scaling. If
 * This should change in the future, you would have
 * to adjust the formula either way.
 *
 * @param zoom The zoom value for which you want
 *          to know the conversion ratio from
 *          pixel to LatLng
 */
function getLatLngPerPixel(zoom) {
  //256 is the Map Width (px) on zoom = 0
  var lng = 360 / (256 * (Math.pow(2, zoom)));
  var lat = 2 * lng / Math.PI;

  return new google.maps.LatLng(lat, lng);
}
