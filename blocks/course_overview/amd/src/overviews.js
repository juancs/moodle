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
 * An AMD module that handles the loading of overviews via AJAX requests
 *
 * @module    block_course_overview/overviews
 * @class     overviews
 * @package   block_course_overview
 * @copyright 2016 Universitat Jaume I {@link http://www.uji.es/}
 * @author    Juan Segarra Montesinos <juan.segarra@uji.es>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'core/config', 'core/log', 'block_course_overview/collapsible', 'core/str'],
        function($, cfg, log, collapsible, str) {

    var _courseIds;
    var _overviewStep;
    var _warnImgUrl;

    /**
     * Ajax success callback.
     *
     * @param {Array} courseIds Course ids that were used in the request.
     * @param {Object} ret Response.
     * @param {string} textStatus The status string.
     * @param {jqXHR} xhr The ajax object.
     */
    var onGetCourseOverviewSuccess = function (courseIds, ret, testStatus, xhr) {
        var i;
        var sc = xhr.statusCode();
        if (!sc || sc.status != 200 || ret.error) {
            log.error("ERROR getting overviews for courses: " + courseIds);

            // mark remaining courses as failed.
            for (i = 0; i < courseIds.length; i++) {
                setWarningToLoadingImg(courseIds[i]);
            }
            for (i = 0; i < _courseIds.length; i++) {
                setWarningToLoadingImg(_courseIds[i]);
            }
        } else {
            var to = ret.courses.length;
            for (i = 0; i < to; i++) {
                hideLoadingImg(ret.courses[i].id);
                var course_title = $('div#course-' + ret.courses[i].id + ' .course_title');
                course_title.after(ret.courses[i].content);
                // Initialize collapsible regions
                $('div#course-' + ret.courses[i].id + ' .collapsibleregion').each(initCollapsible);
            }

        }
    };

    /**
     * Performs an ajax request to get courses overview information based on
     * _courseIds array and _overviewStep properties.
     */
    var getCoursesOverview = function() {
        if (_courseIds.length <= 0) {
            return;
        }
        var cids = _courseIds.splice(0, _overviewStep);
        var data = {
            courseids: cids.join(",")
        };
        $.get(
            cfg.wwwroot + '/blocks/course_overview/overview_ajax.php',
            data,
            'json'
        ).done(
            function(ret, textStatus, xhr) {
                onGetCourseOverviewSuccess(cids, ret, textStatus, xhr);
                if (_courseIds.length > 0) {
                    getCoursesOverview();
                }
            }
        ).fail(
            function() {
                // mark all courses as failed.
                var i;
                for (i = 0; i < cids.length; i++) {
                    setWarningToLoadingImg(cids[i]);
                }
                for (i = 0; i < _courseIds; i++) {
                    setWarningToLoadingImg(_courseIds[i]);
                }
            }
        );
    };

    /**
     * Callback function used in an each() method called for every
     * collapsible region. Initializes the collapsible region.
     *
     * @param {int} index the index in the collection of nodes.
     * @param {element} node the collapsible region that we're going to initialize.
     */
    var initCollapsible = function(index, node) {
        str.get_string('clicktohideshow', 'moodle').done(function(s) {
            collapsible.collapsible($(node).attr('id'), false, s);
        });
    };

    /**
     * Hides the loading overview img.
     *
     * @param {int} courseId the courseid to get the appropiate image to hide.
     */
    var hideLoadingImg = function(courseId) {
        $('#course-' + courseId + ' img.overview_state').hide();
    };

    /**
     * Changes the loading image to a warn icon to indicate some problem.
     * Usually the ajax call has failed.
     *
     * @param {int} courseId the courseid
     */
    var setWarningToLoadingImg = function(courseId) {
        var img = $('#course-' + courseId + ' img.overview_state');
        str.get_string('cannoloadoverview', 'block_course_overview').done(function(s) {
            img.attr('alt', s);
            img.attr('title', s);
        });
        img.attr('src', _warnImgUrl);
    };

    return {

        /**
         * Runs the requests to get the overviews of the specified courseIds in
         * ajaxstep courses at a tiself. This function should be called from php
         * code.
         *
         * @param {Array} courseIds array of courseIds.
         * @param {int} overviewStep how many courses at a time we're going to ask.
         * @param {warnImgUrl} warnImgUrl a url that points to a warning icon.
         */
        init: function(courseIds, overviewStep, warnImgUrl) {

            log.debug("overview.init: overviewStep=" + overviewStep);

            // Remove mnet courses if present.
            _courseIds = courseIds.filter(function (v) {
                if (v > 0) {
                    return true;
                } else {
                    return false;
                }
            });

            if (_courseIds.length > 0) {
                // How many courses to process per ajax request.
                _overviewStep = overviewStep;

                // The url to a warning image to mark a course overview error.
                _warnImgUrl = warnImgUrl;

                // Start with ajax stuff.
                getCoursesOverview();
            }
        }
    };
});
