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
 * A proxy used to lock the execute() method of the allocator.
 *
 * @package workshopallocation_scheduled
 * @copyright 2020 Jaume I University <https://www.uji.es/>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace workshopallocation_scheduled;

defined('MOODLE_INTERNAL') || die();

class execution_lock {

    /** @const the name of the lock */
    private const LOCK_NAME = 'mod_workshop_allocation_scheduled_execution';

     /** @var \core\lock\lock the lock instance */
    private $lock;

     /** @var int the id of the workshop where execution lock will be locked */
    private $workshopid;

    /**
     * scheduled_allocator_execution_lock constructor.
     *
     * @param int $workshopid the id of the workshop where execution lock will be locked
     */
    public function __construct (int $workshopid) {
        $this->workshopid = $workshopid;
        $this->lock = null;
    }

    public function __destruct() {
        $this->release();
    }

    /**
     * Tries to get the execution lock.
     *
     * @return bool true if successful. false if not.
     * @throws coding_exception
     */
    public function lock(): bool {
        $lockfactory = \core\lock\lock_config::get_lock_factory(self::LOCK_NAME);
        $this->lock = $lockfactory->get_lock($this->workshopid, 1, 30);

        return $this->lock ? true : false;
    }

    /**
     * Releases the execution lock.
     *
     * @return bool
     */
    public function release(): void {
        if ($this->lock) {
            $this->lock->release();
            $this->lock = null;
        }
    }
}