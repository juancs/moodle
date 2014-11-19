M.block_course_overview = {}

M.block_course_overview.add_handles = function(Y) {
    M.block_course_overview.Y = Y;
    var MOVEICON = {
        pix: "i/move_2d",
        component: 'moodle'
    };

    YUI().use('dd-constrain', 'dd-proxy', 'dd-drop', 'dd-plugin', function(Y) {
        //Static Vars
        var goingUp = false, lastY = 0;

        var list = Y.Node.all('.course_list .coursebox');
        list.each(function(v, k) {
            // Replace move link and image with move_2d image.
            var imagenode = v.one('.course_title .move a img');
            imagenode.setAttribute('src', M.util.image_url(MOVEICON.pix, MOVEICON.component));
            imagenode.addClass('cursor');
            v.one('.course_title .move a').replace(imagenode);

            var dd = new Y.DD.Drag({
                node: v,
                target: {
                    padding: '0 0 0 20'
                }
            }).plug(Y.Plugin.DDProxy, {
                moveOnEnd: false
            }).plug(Y.Plugin.DDConstrained, {
                constrain2node: '.course_list'
            });
            dd.addHandle('.course_title .move');
        });

        Y.DD.DDM.on('drag:start', function(e) {
            //Get our drag object
            var drag = e.target;
            //Set some styles here
            drag.get('node').setStyle('opacity', '.25');
            drag.get('dragNode').addClass('block_course_overview');
            drag.get('dragNode').set('innerHTML', drag.get('node').get('innerHTML'));
            drag.get('dragNode').setStyles({
                opacity: '.5',
                borderColor: drag.get('node').getStyle('borderColor'),
                backgroundColor: drag.get('node').getStyle('backgroundColor')
            });
        });

        Y.DD.DDM.on('drag:end', function(e) {
            var drag = e.target;
            //Put our styles back
            drag.get('node').setStyles({
                visibility: '',
                opacity: '1'
            });
            M.block_course_overview.save(Y);
        });

        Y.DD.DDM.on('drag:drag', function(e) {
            //Get the last y point
            var y = e.target.lastXY[1];
            //is it greater than the lastY var?
            if (y < lastY) {
                //We are going up
                goingUp = true;
            } else {
                //We are going down.
                goingUp = false;
            }
            //Cache for next check
            lastY = y;
        });

        Y.DD.DDM.on('drop:over', function(e) {
            //Get a reference to our drag and drop nodes
            var drag = e.drag.get('node'),
                drop = e.drop.get('node');

            //Are we dropping on a li node?
            if (drop.hasClass('coursebox')) {
                //Are we not going up?
                if (!goingUp) {
                    drop = drop.get('nextSibling');
                }
                //Add the node to this list
                e.drop.get('node').get('parentNode').insertBefore(drag, drop);
                //Resize this nodes shim, so we can drop on it later.
                e.drop.sizeShim();
            }
        });

        Y.DD.DDM.on('drag:drophit', function(e) {
            var drop = e.drop.get('node'),
                drag = e.drag.get('node');

            //if we are not on an li, we must have been dropped on a ul
            if (!drop.hasClass('coursebox')) {
                if (!drop.contains(drag)) {
                    drop.appendChild(drag);
                }
            }
        });
    });
}

M.block_course_overview.save = function() {
    var Y = M.block_course_overview.Y;
    var sortorder = Y.one('.course_list').get('children').getAttribute('id');
    for (var i = 0; i < sortorder.length; i++) {
        sortorder[i] = sortorder[i].substring(7);
    }
    var params = {
        sesskey : M.cfg.sesskey,
        sortorder : sortorder
    };
    Y.io(M.cfg.wwwroot+'/blocks/course_overview/save.php', {
        method: 'POST',
        data: build_querystring(params),
        context: this
    });
}

/**
 * Initializes the loading of activity information overview via AJAX. Serialize
 * the ajax call in order to reduce session blocking and to benefit KeepAlive
 * connections
 * 
 * @param {YUI} Y
 * @param {Array} Array of courseIds
 * @param {Array} Array of pixUrls for each module
 */

M.block_course_overview.init_overviews = function (Y, courseIds, pixUrls) {

    if ( ! M.block_course_overview.Y ) {
        M.block_course_overview.Y = Y;
    }
    M.block_course_overview.pixUrls = pixUrls;
    M.block_course_overview.courseIds = courseIds;
    M.block_course_overview.currentCourse = null;

    if ( M.block_course_overview.courseIds.length > 0 ) {
        M.block_course_overview.currentCourse = M.block_course_overview.courseIds.shift();
        var p = {
            courseid: M.block_course_overview.currentCourse
        };
        Y.use('io-base', function(Y) {
            Y.io(M.cfg.wwwroot+'/blocks/course_overview/getoverview.php', {
                method: 'GET',
                data: build_querystring(p),
                context: M.block_course_overview,
                on: {
                    success: M.block_course_overview.handle_next_overview,
                    failure: M.block_course_overview.handle_next_overview
                }
            });
        });
    }
}

/**
 * Ajax success/failure handler for getoverview.php API call
 * 
 * @param {String} Transaction id
 * @param {type} The reponse object
 * @param {type} Arguments
 */

M.block_course_overview.handle_next_overview = function (id, r, a) {

    Y.use('json-parse', 'io-base', function (Y) {

        if (r.responseText) {
            var response = Y.JSON.parse(r.responseText);
            if (!response.error) {
                var ainfo = Y.one('div#course-'+ M.block_course_overview.currentCourse + ' div.activity_info');
                if (ainfo) {

                    var html = '';
                    var regionIds = [];
                    for (var module in response) {

                        // Write the activity info
                        
                        var regionId = 'region_' + M.block_course_overview.currentCourse + '_' + module;

                        html += '<div id="' + regionId + '" class="collapsibleregion collapsed">';
                        html += '<div id="' + regionId + '_sizer">';
                        html += '<div id="' + regionId + '_caption" class="collapsibleregioncaption" title="Haz click">';
                        html += '<a href="#">';
                        html += '<a href="' + M.cfg.wwwroot + '/mod/' + module + '/index.php?id=' + M.block_course_overview.currentCourse + '">';
                        html += '<img class="iconlarge" alt="' + M.str['mod_' + module]['modulename'] + '" title="' + M.str['mod_' + module]['modulename'] + '" src="' + M.block_course_overview.pixUrls[module] + '">';
                        html += '</a>';

                        var str;
                        if ( M.str['mod_' + module] ) {
                            str = M.str['mod_' + module]['activityoverview'];
                        } else {
                            str = M.str.block_course_overview['block_course_overview']['activityoverview'];
                        }

                        html += str;

                        html += '</a>';
                        html += '</div>';
                        html += '<div id="' + regionId + '_inner" class="collapsibleregioninner">';
                        html += response[module];
                        html += '</div></div></div>';

                        regionIds.push(regionId);
                    }
                    ainfo.setHTML(html);
                    
                    for ( var rid in regionIds ) {
                        M.block_course_overview.collapsible(Y,regionIds[rid],false,'');
                    }
                }
            }
        }

        if (M.block_course_overview.courseIds.length > 0) {
            M.block_course_overview.currentCourse = M.block_course_overview.courseIds.shift();
            var p = {
                courseid : M.block_course_overview.currentCourse
            };               
            Y.io(M.cfg.wwwroot+'/blocks/course_overview/getoverview.php', {
                method: 'GET',
                data: build_querystring(p),
                context: M.block_course_overview,
                on: {
                    success: M.block_course_overview.handle_next_overview,
                    failure: M.block_course_overview.handle_next_overview
                }
            });
        }
    });
}

/**
 * Init a collapsible region, see print_collapsible_region in weblib.php
 * @param {YUI} Y YUI3 instance with all libraries loaded
 * @param {String} id the HTML id for the div.
 * @param {String} userpref the user preference that records the state of this box. false if none.
 * @param {String} strtooltip
 */
M.block_course_overview.collapsible = function(Y, id, userpref, strtooltip) {
    if (userpref) {
        M.block_course_overview.userpref = true;
    }
    Y.use('anim', function(Y) {
        new M.block_course_overview.CollapsibleRegion(Y, id, userpref, strtooltip);
    });
};

/**
 * Object to handle a collapsible region : instantiate and forget styled object
 *
 * @class
 * @constructor
 * @param {YUI} Y YUI3 instance with all libraries loaded
 * @param {String} id The HTML id for the div.
 * @param {String} userpref The user preference that records the state of this box. false if none.
 * @param {String} strtooltip
 */
M.block_course_overview.CollapsibleRegion = function(Y, id, userpref, strtooltip) {
    // Record the pref name
    this.userpref = userpref;

    // Find the divs in the document.
    this.div = Y.one('#'+id);

    // Get the caption for the collapsible region
    var caption = this.div.one('#'+id + '_caption');
    caption.setAttribute('title', strtooltip);

    // Create a link
    var a = Y.Node.create('<a href="#"></a>');
    // Create a local scoped lamba function to move nodes to a new link
    var movenode = function(node){
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
        this.div.setStyle('height', caption.get('offsetHeight')+'px');
    }

    // Create the animation.
    var animation = new Y.Anim({
        node: this.div,
        duration: 0.3,
        easing: Y.Easing.easeBoth,
        to: {height:caption.get('offsetHeight')},
        from: {height:height}
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

M.block_course_overview.userpref = false;

/**
 * The user preference that stores the state of this box.
 * @property userpref
 * @type String
 */
M.block_course_overview.CollapsibleRegion.prototype.userpref = null;

/**
 * The key divs that make up this
 * @property div
 * @type Y.Node
 */
M.block_course_overview.CollapsibleRegion.prototype.div = null;

/**
 * The key divs that make up this
 * @property icon
 * @type Y.Node
 */
M.block_course_overview.CollapsibleRegion.prototype.icon = null;

