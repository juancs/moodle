// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * An AMD module that handles collapsible regions for block/course_overview
 *
 * @module    block_course_overview/collapsible
 * @class     collapsible
 * @package   block_course_overview
 * @copyright 2016 Universitat Jaume I {@link http://www.uji.es/}
 * @author    Juan Segarra Montesinos <juan.segarra@uji.es>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'core/log', 'core/yui'], function($, log, Y) {

    /**
     * Collapsible class. This is an adaptation of the CollapsibleRegion
     * using jquery.
     *
     * @class CollapsibleRegion
     * @param {string} id the id of the collapsible region.
     * @param {string} userpref
     * @param {string} strtooltip
     */
    function CollapsibleRegion(id, userpref, strtooltip) {

        var self = this;

        // Record the pref name.
        self.userpref = userpref;

        // Find the divs in the document.
        self.div = $('#' + id);

        // Get the height of the div at this point before we shrink it if required.
        self.divHeight = self.div.height();

        // Get the caption for the collapsible region.
        self.caption = $('#'+id + '_caption');
        self.caption.attr('title', strtooltip);

        // An array of yui animations.
        self.animations = {};

        // Create a link
        var a = $('<a href="#"></a>');
        self.caption.children().wrap(a);

        if (self.div.hasClass('collapsed')) {
            // Shrink the div as it is collapsed by default.
            self.div.height(self.caption.outerHeight()+'px');
        }

        // Create the animation.
        self.caption.click(function(e) {
            e.preventDefault();
            $.proxy(self.yuiToggleDiv, self)();
        });
    }

    /**
     * Toggle the collapsible state of the overview. We use YUI due to
     * performance reason. You can use jqueryToggleDiv instead.
     *
     * @method yuiToggleDiv
     */
    CollapsibleRegion.prototype.yuiToggleDiv = function () {
        var self = this;
        Y.use('anim', function(Y) {
            // Create the animation.
            var div = Y.one('#' + self.div.attr('id'));

            var animation;
            if (self.animations[self.div.attr('id')]) {
                animation = self.animations[self.div.attr('id')];
            } else {
                animation = new Y.Anim({
                    node: div,
                    duration: 0.3,
                    easing: Y.Easing.easeBoth,
                    to: {height:self.caption.outerHeight() + 'px'},
                    from: {height:self.divHeight}
                });
                // Handler for the animation finishing.
                animation.on('end', function() {
                    div.toggleClass('collapsed');
                }, self);
                self.animations[self.div.attr('id')] = animation;
            }

            // Hook up the event handler.
            if (animation.get('running')) {
                animation.stop();
            }
            animation.set('reverse', div.hasClass('collapsed'));
            // Update the user preference.
            if (self.userpref) {
                M.util.set_user_preference(self.userpref, !div.hasClass('collapsed'));
            }
            animation.run();
        });
    };

    /**
     * The animation with jquery is not as good as YUI. I leave this function
     * as a future improvement.
     *
     * @method jqueryToggleDiv
     */
    CollapsibleRegion.prototype.jqueryToggleDiv = function () {
        var self = this;
        var prop;

        if (self.div.hasClass('collapsed')) {
            prop = {
                height: self.divHeight
            };
        } else {
            prop = {
                height: self.caption.outerHeight()
            };
        }
        self.div.animate(prop, 300, 'swing', function() {
            self.div.toggleClass('collapsed');
            if (self.userpref) {
                M.util.set_user_preference(self.userpref, !self.div.hasClass('collapsed'));
            }
        });

    };

    return {

        userpref: null,
        div: null,

        /**
         * This function is called to initialize a collapsible region of an
         * overview.
         *
         * @param {string} id The id of the collapsible region.
         * @param {string} userpref The user preference key.
         * @param {string} strtooltip A string used as a tootil (clicktohideshow)
         */
        collapsible: function(id, userpref, strtooltip) {
            if (userpref) {
                this.userpref = true;
            }
            new CollapsibleRegion(id, userpref, strtooltip);
        }
    };

});
