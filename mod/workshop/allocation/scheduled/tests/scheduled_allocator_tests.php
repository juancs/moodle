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
 * Test for the scheduled allocator.
 *
 * @package workshopallocation_scheduled
 * @copyright 2020 Jaume I University <https://www.uji.es/>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once(dirname(__FILE__) . '/testable_scheduled_allocator.php');

class scheduled_allocator_tests extends advanced_testcase {
    private $course;
    private $workshop;
    private $workshopcm;
    private $students;

    public function setUp(): void {

        $this->setAdminUser();

        $datagenerator = $this->getDataGenerator();

        $this->course = $datagenerator->create_course();

        $this->students = [];
        for ($i = 0; $i < 10; $i++) {
            $this->students[] = $datagenerator->create_and_enrol($this->course);
        }

        $workshopdb = $datagenerator->create_module('workshop', [
            'course' => $this->course,
            'name' => 'Test Workshop',
        ]);
        $this->workshopcm = get_coursemodule_from_instance('workshop', $workshopdb->id, $this->course->id, false, MUST_EXIST);
        $this->workshop = new workshop($workshopdb, $this->workshopcm, $this->course);
    }

    public function test_that_allocator_executes_on_submission_end_when_phaseswitchassessment_is_active(): void {
        global $DB;

        $this->resetAfterTest();

        $DB->set_field('workshop', 'phaseswitchassessment', 1);
        $DB->set_field('workshop', 'submissionend', time() - 1);

        $this->activate_the_scheduled_allocator();

        $workshopgenerator = $this->getDataGenerator()->get_plugin_generator('mod_workshop');

        cron_setup_user();

        // Let the students add submissions.
        $this->workshop->switch_phase(workshop::PHASE_SUBMISSION);

        // Create some submissions.
        foreach ($this->students as $student) {
            $workshopgenerator->create_submission($this->workshop->id, $student->id);
        }

        // No allocations yet.
        $this->assertEmpty($this->workshop->get_allocations());

        // Transition to the assessment phase.
        ob_start();
        $cron = new \mod_workshop\task\cron_task();
        $cron->execute();
        ob_end_clean();

        $workshopdb = $DB->get_record('workshop', ['id' => $this->workshop->id]);
        $workshop = new workshop($workshopdb, $this->workshopcm, $this->course);

        $this->assertEquals(workshop::PHASE_ASSESSMENT, $workshop->phase);
        $this->assertNotEmpty($workshop->get_allocations());
    }

    public function test_that_allocator_is_not_executed_when_phase_is_manually_changed(): void {
        global $DB;
        $this->resetAfterTest();

        $this->activate_the_scheduled_allocator();

        $workshopgenerator = $this->getDataGenerator()->get_plugin_generator('mod_workshop');

        $this->setAdminUser();

        // Let the students add submissions.
        $this->workshop->switch_phase(workshop::PHASE_SUBMISSION);

        // Create some submissions.
        foreach ($this->students as $student) {
            $workshopgenerator->create_submission($this->workshop->id, $student->id);
        }

        // No allocations yet.
        $this->assertEmpty($this->workshop->get_allocations());

        $this->workshop->switch_phase(workshop::PHASE_ASSESSMENT);

        $workshopdb = $DB->get_record('workshop', ['id' => $this->workshop->id]);
        $workshop = new workshop($workshopdb, $this->workshopcm, $this->course);

        // Assert that we have allocations.
        $this->assertEquals($this->workshop->phase, workshop::PHASE_ASSESSMENT);
        $this->assertEmpty($workshop->get_allocations());
    }

    public function test_that_allocator_is_not_executed_when_its_not_active(): void {
        global $DB;

        $this->resetAfterTest();

        $DB->set_field('workshop', 'phaseswitchassessment', 1);
        $DB->set_field('workshop', 'submissionend', time() - 1);

        $workshopgenerator = $this->getDataGenerator()->get_plugin_generator('mod_workshop');

        cron_setup_user();

        // Let the students add submissions.
        $this->workshop->switch_phase(workshop::PHASE_SUBMISSION);

        // Create some submissions.
        foreach ($this->students as $student) {
            $workshopgenerator->create_submission($this->workshop->id, $student->id);
        }

        // No allocations yet.
        $this->assertEmpty($this->workshop->get_allocations());

        // Transition to the assessment phase.
        ob_start();
        $cron = new \mod_workshop\task\cron_task();
        $cron->execute();
        ob_end_clean();

        $workshopdb = $DB->get_record('workshop', ['id' => $this->workshop->id]);
        $workshop = new workshop($workshopdb, $this->workshopcm, $this->course);

        $this->assertEquals(workshop::PHASE_ASSESSMENT, $workshop->phase);
        $this->assertEmpty($workshop->get_allocations());
    }

    /**
     * Activates and configures the scheduled allocator for the workshop.
     */
    private function activate_the_scheduled_allocator(): testable_scheduled_allocator {
        // Configure the allocator.
        $settings = workshop_random_allocator_setting::instance_from_object((object)[
            'numofreviews' => count($this->students),
            'numper' => 1,
            'removecurrentuser' => true,
            'excludesamegroup' => false,
            'assesswosubmission' => true,
            'addselfassessment' => false
        ]);
        $allocator = new testable_scheduled_allocator($this->workshop);
        $allocator->store_settings(true, true, $settings, new workshop_allocation_result($allocator));

        return $allocator;
    }
}
