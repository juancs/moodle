<?php
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
 * Gets courses overview information.
 *
 * @package   block_course_overview
 * @copyright 2016 Universitat Jaume I {@link http://www.uji.es/}
 * @author    Juan Segarra Montesinos <juan.segarra@uji.es>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/locallib.php');

$courseids = required_param('courseids', PARAM_SEQUENCE);
$courseids = explode(',', $courseids);
$courseids = array_unique($courseids);

$config = get_config('block_course_overview');
if ($config->forcedefaultmaxcourses) {
    if ($config->defaultmaxcourses < BLOCKS_COURSE_OVERVIEW_MAX_OVERVIEWSTEP) {
        $maxoverviewstep = $config->defaultmaxcourses;
    } else {
        $maxoverviewstep = BLOCKS_COURSE_OVERVIEW_MAX_OVERVIEWSTEP;
    }
} else {
    $maxoverviewstep = BLOCKS_COURSE_OVERVIEW_MAX_OVERVIEWSTEP;
}
if (count($courseids) > $maxoverviewstep) {
    throw new moodle_exception('toomanycoursesrequested', 'block_course_overview');
}

require_login(null, false, null, false, true);

if (isguestuser() && !$CFG->allowguestmymoodle) {
    header('HTTP/1.1 403 Forbidden');
    print_error('guestsarenotallowed');
}

// To avoid session locking issues.
\core\session\manager::write_close();

// Exclude not my courses.
$mycourses = enrol_get_my_courses();
$courses = array();
foreach ($courseids as $cid) {
    if (array_key_exists($cid, $mycourses) and $cid > 0) {
        $courses[$cid] = $mycourses[$cid];
    }
}
unset($mycourses);
unset($courseids);

foreach ($courses as $course) {
    if (isset($USER->lastcourseaccess[$course->id])) {
        $course->lastaccess = $USER->lastcourseaccess[$course->id];
    } else {
        $course->lastaccess = 0;
    }
}

$overviews = block_course_overview_get_overviews($courses);
if ($overviews) {
    $renderer = $PAGE->get_renderer('block_course_overview');

    $coursedata = array();
    foreach ($courses as $course) {
        $html = $renderer->activity_display($course->id, $overviews[$course->id]);
        if ( $html ) {
            $courseinfo = new \stdClass();
            $courseinfo->id = $course->id;
            $courseinfo->content = $html;

            $coursedata[] = $courseinfo;
        }
    }
    $ret = new \stdClass();
    $ret->courses = $coursedata;
} else {
    $ret = new \stdClass();
    $ret->courses = array();
}

echo json_encode($ret);
die;
