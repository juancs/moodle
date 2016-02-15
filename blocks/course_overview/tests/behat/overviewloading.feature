@block @block_course_overview
Feature: Course overview information must be loaded via AJAX
  In order to get course overview information
  As a user
  I need to see the course overview block

  Background:
    Given the following "users" exist:
      | username | firstname | lastname | email | idnumber |
      | teacher1 | Teacher | 1 | teacher1@example.com | T1 |
      | student1 | Student | 1 | student1@example.com | S1 |
    And the following "courses" exist:
      | fullname | shortname | category |
      | Course 1 | C1 | 0 |
    And the following "course enrolments" exist:
      | user | course | role |
      | teacher1 | C1 | editingteacher |
      | student1 | C1 | student |
    And I log in as "teacher1"
    And I follow "Course 1"
    And I turn editing mode on
    And I add a "Forum" to section "1" and I fill the form with:
      | Forum name | Test forum name 1 |
      | Description | Test forum description 1 |
    And I add a new discussion to "Test forum name 1" forum with:
      | Subject | Discussion 1 |
      | Message | Discussion contents 1, first message |
    And I follow "Course 1"
    And I add a "Chat" to section "1" and I fill the form with:
      | Name of this chat room | Chat room 1 |
      | Description | Testing chat room 1 |
      | Repeat/publish session times  | No repeats - publish the specified time only |
    And I log out

  @javascript
  Scenario: Student sees overview information collapsed
    Given I log in as "student1"
    And I am on homepage
    Then I should see "There are new forum posts"
    And I should not see "Forum: Test forum name 1"
    And I should see "You have upcoming chat sessions"
    And I should not see "Chat: Chat room 1"

  @javascript
  Scenario: Student expands overview information
    Given I log in as "student1"
    And I am on homepage
    When I click on "//div[@class='collapsibleregioncaption' and contains(@id, 'chat_caption')]" "xpath_element"
    Then I should see "Chat: Chat room 1"
    And I should not see "Forum: Test forum name 1"
    And I click on "//div[@class='collapsibleregioncaption' and contains(@id, 'forum_caption')]" "xpath_element"
    And I should see "Forum: Test forum name 1"
