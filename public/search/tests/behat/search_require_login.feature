@core @core_search
Feature: Require login to access search results
  In order to restrict access to search results
  As an administrator
  I need to enable the searchrequirelogin setting

  Background:
    Given the following config values are set as admin:
      | enableglobalsearch | 1        |
      | searchengine       | simpledb |
    And I am on homepage

  @javascript
  Scenario: Allow access to search results when login is not required
    Given the following config values are set as admin:
        | searchrequirelogin | 0 |
    When I search for "frogs" using the header global search box
    Then I should see "Global search"

  @javascript
  Scenario: Scenario: Prevent access to search results for unauthenticated users when searchrequirelogin is enabled
    Given the following config values are set as admin:
        | searchrequirelogin | 1 |
    When I search for "frogs" using the header global search box
    Then I should not see "Global search"
    And I should see "Log in to"
