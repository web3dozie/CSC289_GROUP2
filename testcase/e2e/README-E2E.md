***Documentation on how to run E2E test and What it does?***  
### What is E2E test? ###
End to End Test(E2E) is to validate that the entire application system flow to ensure all components work together as expected.

PreRequisite for TMS web app:
- User should have account with username and correct pin number to unlock the account

For testing Requirement:
- Should have Python installed  
    - pip install python
    - python --version
- Should have Selenium installed  
    - pip install Selenium  
    - pip show Selenium
- Should have Chromedriver installed  
    - Download Chromedriver  
    - Locate downloaded path and setup environment variable for Chromedriver 
    - Chromedriver --version
- Should have robotframework-seleniumlibrary  
    - pip install robotframework-seleniumlibrary  
    - pip show robotframework-seleniumlibrary
- Should have robotframework installed  
    - pip install robotframework  
    - pip show robotframework  
- To verify all installations:  
    - pip list

After installations, to run test script app should be running on background(frontend and backend).  
To run individual test give the required tag name as below:  
example 1: for login  
robot --include login e2e.robot  
example 2: for addition of task  
robot --include create-task e2e.robot  
example 3: for Data Segregation   
robot --include data-seg e2e.robot  
 

## Report for the E2E test
After running the test, it will show pass or fail status in the console.  
Report will be generated in the same directory as report.html after running the test.
It will also generate screenshot of the test process in the same directory.