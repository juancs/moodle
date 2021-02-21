@mod @mod_forum
Feature: Changes to the subscription mode of a forum can change subcribers of a forum

  Background:
    Given the following "users" exist:
      | username | firstname | lastname | email |
      | teacher  | Teacher   | Tom      | teacher@example.com   |
      | student1 | Student   | 1        | student.1@example.com |
      | student2 | Student   | 2        | student.2@example.com |
    And the following "courses" exist:
      | fullname | shortname | category |
      | Course 1 | C1 | 0 |
    And the following "course enrolments" exist:
      | user     | course | role           |
      | teacher  | C1     | editingteacher |
      | student1 | C1     | student        |
      | student2 | C1     | student        |
    And I log in as "teacher"
    And I am on "Course 1" course homepage with editing mode on
    And I add a "Forum" to section "1" and I fill the form with:
      | Forum name        | Test forum name                |
      | Forum type        | Standard forum for general use |
      | Description       | Test forum description         |
      | Subscription mode | Forced subscription              |

  Scenario: A change from Forced subscription to Auto subcription causes all participants to be subscribed
    Given I follow "Test forum name"
    When I follow "Auto subscription"
    Then user "student1" should be subscribed to forum "Test forum name" in course "Course 1"
    And user "student2" should be subscribed to forum "Test forum name" in course "Course 1"
    And user "teacher" should be subscribed to forum "Test forum name" in course "Course 1"
