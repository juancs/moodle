@core_form
Feature: Using the course summary element
  In order to verify the use of editors in the editor element
  As an admin
  I will see the case for the editor used when adding a new element and when editing an already added one

  @javascript
  Scenario: When creating a new editor element, preferred editor format must be presented
    Given the following "user preferences" exist:
      | user   | preference   | value    |
      | admin  | htmleditor   | textarea |
    And I am on the "My courses" page logged in as "admin"
    When I click on "Course management options" "link"
    And I click on "New course" "link"
    And I wait to be redirected
    Then I should see "Moodle auto-format" in the "#menusummary_editorformat > option[selected]" "css_element"

  @javascript
  Scenario: When editing an editor element the used format must be presented
    Given I am on the "My courses" page logged in as "admin"
    And the following "user preferences" exist:
      | user   | preference   | value    |
      | admin  | htmleditor   | textarea |
    And the following "courses" exist:
      | fullname   | shortname    | summary     | summaryformat |
      | C1         | C1           | Test into   | 4             |
    And I am on "C1" course homepage with editing mode on
    When I click on "Settings" "link"
    Then I should see "Markdown format" in the "#menusummary_editorformat > option[selected]" "css_element"
