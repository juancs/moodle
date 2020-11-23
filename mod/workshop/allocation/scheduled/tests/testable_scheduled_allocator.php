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

defined('MOODLE_INTERNAL') || die();

/**
 * A testable scheduled allocator. We need the store_settings method public.
 *
 * @package workshopallocation_scheduled
 * @copyright 2020 Jaume I University <https://www.uji.es/>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(__FILE__) . ' /../lib.php');

class testable_scheduled_allocator extends workshop_scheduled_allocator {

    public function store_settings($enabled, $reset, workshop_random_allocator_setting $settings,
                                   workshop_allocation_result $result) {
        parent::store_settings($enabled, $reset, $settings, $result);
    }
}

