
/**
 * PanoMarker
 * Version 0.0
 *
 * @author kaktus621@gmail.com (Martin Matysiak)
 * @fileoverview A marker that can be placed inside custom StreetView panoramas.
 * Regular markers inside StreetViewPanoramas can only be shown vertically
 * centered and aligned to LatLng coordinates.
 *
 * Custom StreetView panoramas usually do not have any geographical information
 * (e.g. inside views), thus a different method of positioning the marker has to
 * be used. This class takes simple heading and pitch values from the panorama's
 * center in order to move the marker correctly with the user's viewport
 * changes.
 *
 * Since something like that is not supported natively by the Maps API, the
 * marker actually sits on top of the panorama, DOM-wise outside of the
 * actual map but still inside the map container.
 */

/**
 * @license Copyright 2014 Martin Matysiak.
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
 * PanoMarkerOptions
 *
 * Please note that some parameters are required! If those are not specified,
 * an error will be thrown.
 *
 * {google.maps.StreetViewPanorama} pano Panorama in which to display marker.
 * {google.maps.StreetViewPov} position Marker position.
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
 * @param {PanoMarkerOptions} opts A set of parameters to customize the marker.
 */
var PanoMarker = function(opts) {
  // In case no options have been given at all, fallback to {} so that the
  // following won't throw errors.
  opts = opts || {};

  /** @private @type {?google.maps.StreetViewPanorama} */
  this.pano_ = opts.pano || null;

  /** @private @type {google.maps.StreetViewPov} */
  this.position_ = opts.position || {heading: 0, pitch: 0};

  /** @private @type {?string} */
  this.id_ = opts.id || null;

  /** @private @type {?string} */
  this.class_ = opts.className || null;

  /** @private @type {?string} */
  this.icon_ = opts.icon || null;

  /** @private @type {?string} */
  this.title_ = opts.title || null;

  /** @private @type {boolean} */
  this.visible_ = opts.visible || true;

  /** @private @type {google.maps.Size} */
  this.size_ = opts.size || new google.maps.Size(32, 32);

  /** @private @type {google.maps.Point} */
  this.anchor_ = opts.anchor || new google.maps.Point(16, 16);

  /** @private @ŧype {?HTMLDivElement} */
  this.marker_ = null;

  /** @priavte @type {Object} */
  this.povListener_ = null;

  // At last, call some methods which use the initialized parameters
  this.create_();
  this.setPano(this.pano_);
};


/**
 * @return {number} The (horizontal) field of views for the supported zoom
 *     levels. The documentation provides values for integral zoom levels,
 *     intermediate levels have to be interpolated, but they seem to follow a
 *     logarithmic curve.
 */
PanoMarker.getFov = function(zoom) {
  return 180.0 / Math.pow(2, zoom);
};


/**
 * @param {StreetViewPov} targetPov The point-of-view whose coordinates are
 *     requested.
 * @param {StreetViewPov} currentPov POV of the viewport center.
 * @param {Element} viewport The current viewport containing the panorama.
 * @return {Object} Top and Left offsets for the given viewport that point to
 *     the desired point-of-view.
 */
PanoMarker.povToPixel = function(targetPov, currentPov, viewport) {
  var target = {
    left: viewport.offsetWidth / 2,
    top: viewport.offsetHeight / 2
  };

  var currentFov = PanoMarker.getFov(currentPov.zoom);
  var linearHorizPxPerDegree = viewport.offsetWidth / currentFov;
  var linearVertPxPerDegree = viewport.offsetHeight / currentFov;

  target.left += (targetPov.heading - currentPov.heading) * linearHorizPxPerDegree;
  target.top -= (targetPov.pitch - currentPov.pitch) * linearVertPxPerDegree;

  return target;
};


PanoMarker.prototype.create_ = function() {
  var marker = document.createElement('div');

  // Basic style attributes for every marker
  marker.style.position = 'relative';
  marker.style.cursor = 'pointer';
  marker.style.width = this.size_.width + 'px';
  marker.style.height = this.size_.height + 'px';
  marker.style.display = this.visible_ ? 'block' : 'none';
  marker.style.zIndex = '2';

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

  this.marker_ = marker;
};


/** @override */
PanoMarker.prototype.draw = function() {
  if (!this.pano_) {
    return;
  }

  // Calculate the position according to the viewport etc etc
  var offset = PanoMarker.povToPixel(this.position_,
      this.pano_.getPov(),
      this.pano_.getContainer());

  this.marker_.style.left = (offset.left - this.anchor_.x) + 'px';
  this.marker_.style.top = (offset.top - this.anchor_.y) + 'px';
};


/**
 * Getter for .position_
 * @return {google.maps.LatLng} An object representing the current position.
 */
PanoMarker.prototype.getPosition = function() { return this.position_; };


/**
 * Method for repositioning the marker. The change will be drawn immediatly
 *
 * @param {google.maps.LatLng} position A google.maps.LatLng object with
 * the desired position.
 */
PanoMarker.prototype.setPosition = function(position) {
  this.position_ = position;
  this.draw();
};


/**
 * Method for obtaining the Identifier of the marker
 *
 * @return {string} The identifier or null if not set upon marker creation.
*/
PanoMarker.prototype.getId = function() {
  return this.id_;
};


/**
 * Getter for .title_
 * @return {string} If set, the marker's rollover text, otherwise an empty
 *    string.
 */
PanoMarker.prototype.getTitle = function() {
  return this.title_ || '';
};


/**
 * Setter for .title_
 * @param {string} title the new rollover text.
 */
PanoMarker.prototype.setTitle = function(title) {
  this.title_ = title;
  this.marker_.title = title;
};


/**
 * Getter for .visible_
 * @return {boolean} true if the marker is set to being visible, else false.
 */
PanoMarker.prototype.getVisible = function() {
  return this.visible_;
};


/**
 * Setter for .visible_
 * @param {boolean} show true if marker shall be shown, else false.
 */
PanoMarker.prototype.setVisible = function(show) {
  this.visible_ = show;
  this.marker_.style.display = show ? 'block' : 'none';
};


/**
 * Getter for .pano_
 * @return {google.maps.StreetViewPanorama} The panorama.
 */
PanoMarker.prototype.getPano = function() { return this.pano_; };


/**
 * Setter for .pano_. Adds the marker to the requested panorama.
 * @param {google.maps.StreetViewPanorama} pano The new panorama, or null if the
 *    marker shall be removed.
 */
PanoMarker.prototype.setPano = function(pano) {
  if (pano == null) {
    this.marker_.parentNode.removeChild(this.marker_);
  } else {
    // Unbind from old panorama, if any
    if (this.povListener_ !== null) {
      google.maps.event.removeListener(this.povListener_);
    }

    pano.getContainer().appendChild(this.marker_);
    this.povListener_ =
      google.maps.event.addListener(pano, 'pov_changed', this.draw.bind(this));
  }

  this.pano_ = pano;
  this.draw();
};
