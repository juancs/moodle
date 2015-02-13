YUI.add('moodle-block_course_overview-ajaxoverview', function (Y, NAME) {

M.block_course_overview = M.block_course_overview || {};
M.block_course_overview.ajaxoverview = M.block_course_overview.ajaxoverview || {};

var NS = M.block_course_overview.ajaxoverview;

var URLS = {
        GETOVERVIEW: M.cfg.wwwroot + '/blocks/course_overview/getoverview_ajax.php'
    },
    SELECTORS = {
        COLLAPSIBLEREGION: '.collapsibleregion',
        COURSETITLE: '.course_title',
        LOADINGINDICATOR: '.block_course_overview .loadingoverview',
        COURSECHILDREN: '.coursechildren'
    },
    ICONS = {
        STATEWARNING: 'i/warning'
    };

/**
 * @class CollapsibleRegion
 */
NS.CollapsibleRegion = function() {
    NS.CollapsibleRegion.superclass.constructor.apply(this, arguments);
};

/**
 * Object to handle a collapsible region : instantiate and forget styled object
 *
 * @class
 * @constructor
 * @param {String} id The HTML id for the div.
 * @param {String} userpref The user preference that records the state of this box. false if none.
 * @param {String} strtooltip
 */

NS.CollapsibleRegion = function(id, userpref, strtooltip) {
    // Record the pref name
    this.userpref = userpref;

    // Find the divs in the document.
    this.div = Y.one('#' + id);

    // Get the caption for the collapsible region
    var caption = this.div.one('#' + id + '_caption');
    caption.setAttribute('title', strtooltip);

    // Create a link
    var a = Y.Node.create('<a href="#"></a>');
    // Create a local scoped lamba function to move nodes to a new link
    var movenode = function(node) {
        node.remove();
        a.append(node);
    };
    // Apply the lamba function on each of the captions child nodes
    caption.get('children').each(movenode, this);
    caption.prepend(a);

    // Get the height of the div at this point before we shrink it if required
    var height = this.div.get('offsetHeight');
    if (this.div.hasClass('collapsed')) {
        // Shrink the div as it is collapsed by default
        this.div.setStyle('height', caption.get('offsetHeight') + 'px');
    }

    // Create the animation.
    var animation = new Y.Anim({
        node: this.div,
        duration: 0.3,
        easing: Y.Easing.easeBoth,
        to: {height: caption.get('offsetHeight')},
        from: {height: height}
    });

    // Handler for the animation finishing.
    animation.on('end', function() {
        this.div.toggleClass('collapsed');
    }, this);

    // Hook up the event handler.
    caption.on('click', function(e, animation) {
        e.preventDefault();
        // Animate to the appropriate size.
        if (animation.get('running')) {
            animation.stop();
        }
        animation.set('reverse', this.div.hasClass('collapsed'));
        // Update the user preference.
        if (this.userpref) {
            M.util.set_user_preference(this.userpref, !this.div.hasClass('collapsed'));
        }
        animation.run();
    }, this, animation);
};

/**
 * The user preference that stores the state of this box.
 * @property userpref
 * @type String
 */

NS.CollapsibleRegion.prototype.userpref = null;

/**
 * The key divs that make up this
 * @property div
 * @type Y.Node
 */
NS.CollapsibleRegion.prototype.div = null;

/**
 * The key divs that make up this
 * @property icon
 * @type Y.Node
 */
NS.CollapsibleRegion.prototype.icon = null;

/**
 * The function to call to initialize the plugin from PHP
 * @param {Object} params An object with courseIds and step properties
 */
NS.init = function(params) {

    // An array of plugin to work with
    NS.courseIds = params.courseIds;

    // How many courses to send per request
    NS.step = params.overviewStep;

    if (NS.courseIds.length > 0) {
        var courseIds = NS.courseIds.splice(0, NS.step);
        var p = {
            courseids: courseIds.join()
        };
        Y.io(URLS.GETOVERVIEW, {
            method: 'GET',
            data: p,
            'arguments': courseIds,
            on: {
                complete: NS.handleNextOverview
            }
        });
    }
};

/**
 * On complete io handler
 *
 * @param {Integer} id The if of the transaction
 * @param {Object} r The response object
 * @param {Array} courseIds The set of courses requested
 */
NS.handleNextOverview = function(id, r, courseIds) {

    try {
        if (r.status == 200 && r.responseText) {
            var response = Y.JSON.parse(r.responseText);
            if (!response.error) {
                NS.removeOverviewState(courseIds);
                if (response.coursecount > 0) {
                    Y.Array.each(response.coursedata, function ( course ) {
                        // First, insert the data just after the course title or coursechildren
                        var courseDiv = Y.one('div#course-' + course.id);
                        var auxDiv = courseDiv.one('> ' + SELECTORS.COURSECHILDREN);
                        if (!auxDiv) {
                            auxDiv = courseDiv.one('> ' + SELECTORS.COURSETITLE);
                        }
                        auxDiv.insert(course.content, 'after');

                        // Intialize collapsible regions.
                        var collapsibles = courseDiv.all(SELECTORS.COLLAPSIBLEREGION);
                        collapsibles.each(function(node) {
                            new NS.CollapsibleRegion(node.get('id'), false, M.util.get_string('clicktohideshow', 'moodle'));
                        });
                    });
                }
            } else {
                NS.addErrorState(courseIds, response.error);
            }
        } else if ( r.status != 200 ) {
            NS.addErrorState(courseIds, "Request status returned: " + r.status);
        } else {
            NS.removeOverviewState(courseIds);
        }
    } catch (e) {
        NS.addErrorState(courseIds, e);
    }

    if (NS.courseIds.length > 0) {
        var cids = NS.courseIds.splice(0, NS.step);
        var p = {
            courseids: cids.join()
        };
        Y.io(URLS.GETOVERVIEW, {
            method: 'GET',
            data: p,
            'arguments': cids,
            on: {
                complete: NS.handleNextOverview
            }
        });
    } else {
        var loadingDiv = Y.one(SELECTORS.LOADINGINDICATOR);
        loadingDiv.hide(true);
    }
};

/**
 * Removes ajax state icons
 * @param {Array} courseIds The set of courseids to process
 * @returns {undefined}
 */
NS.removeOverviewState = function (courseIds) {
    Y.Array.each(courseIds, function ( courseId ) {
        Y.one('div#course-' + courseId + " .overview_state").remove();
    });
};

/**
 * Establishes an error state icon to the set of courseIds specified
 *
 * @param {Array} courseIds
 * @param {String} errorMsg
 * @returns {undefined}
 */
NS.addErrorState = function (courseIds, errorMsg) {
    Y.Array.each(courseIds, function ( courseId ) {
        var overviewState = Y.one('div#course-' + courseId + " .overview_state");
        overviewState.setAttribute('src', M.util.image_url(ICONS.STATEWARNING, 'moodle'));
        overviewState.setAttribute('title', errorMsg);
    });
};


}, '@VERSION@', {"requires": ["base", "io-base", "querystring-stringify-simple", "json-parse", "node", "anim"]});
