*** Settings ***
Library     SeleniumLibrary

*** Variables ***
${URL}  http://localhost:5173/
${browser}     chrome
${USERNAME}    testuser
${PINCODE}     123456
${TASK}        Review PR
${Taskadd}     Review PR today
${TASK2}       Set an alarm
${Describe}    Please do it today
${Date}     01022026
${time}      120

*** Test Cases ***
Create User Account
    [Tags]      create-account
    Open Application
    Sign Up User
    [Teardown]    Close Browser

Login To TMS
    [Tags]      login
    Open Application
    Login With PIN
    [Teardown]    Close Browser

Create Task
    [Tags]      create-task
    Open Application
    Login With PIN
    Add Task
    [Teardown]    Close Browser

Edit Task
    [Tags]      edit
    Open Application
    Login With PIN
    Edit Existing Task
    [Teardown]    Close Browser

Delete Task
    [Tags]      delete
    Open Application
    Login With PIN
    Delete Task
    [Teardown]    Close Browser

Toggle Theme
    [Tags]      theme
    Open Application
    Login With PIN
    Toggle Dark Mode
    Toggle Light Mode
    [Teardown]    Close Browser

*** Keywords ***
Open Application
    open browser    ${URL}      ${browser}
    maximize browser window
    Click Element   xpath://a[@class='inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2']
 
 Sign Up User
    Click Element   xpath://a[normalize-space()='Set up your account']
    Input Text      id:username   ${USERNAME} 
    Input Text      xpath://input[@id='pin']   ${PINCODE}
    Input Text      xpath://input[@id='confirmPin']    ${PINCODE}
    Click Element   xpath://button[normalize-space()='Set Up Account']
    Wait Until Location Contains    /app    timeout=10s

 Login With PIN
    Input Text    id:username   ${USERNAME}
    Input Text    xpath://input[@id='pin']    ${PINCODE}
    Click Button    xpath://button[normalize-space()='Unlock App']
    Wait Until Location Contains    /app    timeout=10s

Add Task
    Click Element   xpath://a[normalize-space()='List']
    Click Element   xpath://button[normalize-space()='New Task']
    Input Text  xpath://input[@id='task-title']     ${TASK}
    Input Text      id:task-description     ${Describe}
    Click Button    id:task-priority
    Input Text    id:task-due-date     ${Date}
    Input Text    id:task-estimate      ${time}
    Click Button  xpath://button[normalize-space()='Create Task']
Edit Existing Task
    Click Element       xpath://a[normalize-space()='List']
    Wait Until Page Contains Element    xpath://div[contains(text(), '${TASK}')]    10s
    Click Element       xpath=//div[contains(@class,'task-row')]//*[contains(normalize-space(.),'${TASK}')]
    Wait Until Page Contains Element    xpath://button[normalize-space()='Edit']    10s
    Click Button    xpath://button[normalize-space()='Edit']
    Wait Until Page Contains Element    xpath://input[@id='task-title']    10s
    Click Element       xpath://input[@id='task-title']
    Clear Element Text      xpath://input[@id='task-title']
    Input Text      css:#task-title    ${Taskadd}
    Click Button        xpath://button[normalize-space()='Update Task']
Delete Task
    Click Element   xpath://a[normalize-space()='List']
    Click Element   xpath:/html[1]/body[1]/div[1]/div[1]/div[1]/main[1]/div[1]/div[2]/div[1]/div[2]/article[1]/header[1]/div[2]/button[1]/*[name()='svg'][1]/*[name()='circle'][1]
    Click Element   xpath://button[normalize-space()='Delete']
    Click Element   xpath://button[normalize-space()='Delete']

Toggle Dark Mode
    Click Element    css:section > a
    Wait Until Page Contains Element    css:label:nth-of-type(2) div.font-medium    5s
    Click Element    css:label:nth-of-type(2) div.font-medium
    Wait Until Keyword Succeeds    5x    1s    Check Body Class Contains    dark
    Click Element    css:label:nth-of-type(3) div.font-medium
    Wait Until Keyword Succeeds    5x    1s    Check Body Class Not Contains    dark

Toggle Light Mode
    Click Button    xpath://button[normalize-space()='Light Mode']
    Wait Until Page Contains Element    xpath://body[not(contains(@class,'dark'))]

Check Body Class Contains
    [Arguments]    ${expected}
    ${class}=    Get Element Attribute    xpath://body    class
    Should Contain    ${class}    ${expected}

Check Body Class Not Contains
    [Arguments]    ${unexpected}
    ${class}=    Get Element Attribute    xpath://body    class
    Should Not Contain    ${class}    ${unexpected}