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
 * Get activities' overview information for a course
 *
 * @package    block_course_overview
 * @copyright  2014 Universitat Jaume I
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);
define('MAX_COURSES_TO_PROCESS', 10);

require_once(__DIR__ . '/../../config.php');

$courseids = required_param('courseids', PARAM_SEQUENCE);
$courseids = explode(',', $courseids);
$courseids = array_unique($courseids);
if ( count($courseids) > MAX_COURSES_TO_PROCESS ) {
    throw new moodle_exception('toomanycoursesrequested', 'block_course_overview');
}

require_login(SITEID, false, null, false, true);

// To avoid session locking issues.
\core\session\manager::write_close();

// Exclude not my courses.

$mycourses = enrol_get_my_courses();
$courses = array();
foreach ($courseids as $cid) {
    if (array_key_exists($cid, $mycourses)) {
        $courses[$cid] = $mycourses[$cid];
    }
}
unset($mycourses);
unset($courseids);

require_once(__DIR__ . '/locallib.php');

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

    $coursecount = 0;
    $coursedata = array();
    foreach ($courses as $course) {
        $html = $renderer->activity_display($course->id, $overviews[$course->id]);
        if ( $html ) {
            $courseinfo = new \stdClass();
            $courseinfo->id = $course->id;
            $courseinfo->content = $html;

            $coursedata[] = $courseinfo;
            $coursecount++;
        }
    }

    $ret = new \stdClass();
    $ret->coursecount = $coursecount;
    $ret->coursedata = $coursedata;

} else {
    $ret = new \stdClass();
    $ret->coursecount = 0;
    $ret->coursedata = array();
}

echo json_encode($ret);
