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
 * @copyright  2014 Universitat Jaume I <juan.segarra@uji.es>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(dirname(__FILE__) . '/../../config.php');
require_once(dirname(__FILE__). '/locallib.php');

$courseid = required_param('courseid', PARAM_INT);

require_login(SITEID, false, null, false, true);

require_once($CFG->dirroot.'/user/profile/lib.php');

$course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
if (isset($USER->lastcourseaccess[$course->id])) {
    $course->lastaccess = $USER->lastcourseaccess[$course->id];
} else {
    $course->lastaccess = 0;
}

$overview = block_course_overview_get_overviews(array($course->id => $course));

if ( $overview ) {
    $overview = $overview[$course->id];
    $overview = json_encode($overview);
} else {
    $overview = "";
}

echo $overview;
