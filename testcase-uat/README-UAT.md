***Documentation on how to run User Acceptance Testing and What it does?***  
### What is UAT? ###
User Acceptance Test(UAT) is to validate that the software meets the business requirement and works as expected to the end user.

PreRequisite for TMS web app:
- User should have account with correct pin number to unlock the account

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

After installations, the app and the testscipt should be on same directory to run and app should be running on background.  
To run the app:  
./run-backend.ps1 and ./run-frontend.ps1  
To run individual test:  
example1: for login  
robot --include login UAT_TMS.robot  
example2: for addition of task  
robot --include add UAT_TMS.robot  
To run full test:  
robot UAT_TMS.robot  

## Report for the UAT  
Report will be generated in the same directory as report.html after running the test.