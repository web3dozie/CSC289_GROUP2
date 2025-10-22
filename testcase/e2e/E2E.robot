*** Settings ***
Library     SeleniumLibrary

*** Variables ***
${URL}  http://localhost:5173/
${browser}     chrome
${USERNAME}    testuser123
${PINCODE}     987654
${USERNAME1}    user123
${PINCODE1}     987654
${TASK}        Create User Story
${Taskadd}     Review PR Today
${TASK2}       Set an Alarm
${MOVE_TASK_TITLE}    Move Board Task
${DRAG_TASK_TITLE}    Drag Drop Story
${Describe}    Please try do it ASAP
${Date}     10242025
${time}      120
${NewDate}  10262025

*** Test Cases ***
Create User Account
    [Tags]      create-account
    Open Application
    Sign Up User
    [Teardown]    Close Browser

Login
    [Tags]      login
    Open Application
    Wait Until Element Is Visible    id:username
    Login With PIN
    [Teardown]    Close Browser

Create Task
    [Tags]      create-task
    Open Application
    Login With PIN
    Add Task
    [Teardown]    Close Browser

Edit Task
    [Tags]      edit-task
    Open Application
    Login With PIN
    Edit Existing Task
    [Teardown]    Close Browser

Delete Task
    [Tags]      delete-task
    Open Application
    Login With PIN
    Delete Task
    [Teardown]    Close Browser

Toggle Theme
    [Tags]      theme
    Open Application
    Login With PIN
    Toggle DarkLight
    [Teardown]    Close Browser

Logout
    [Tags]  logout
    Open Application
    Wait Until Element Is Visible    id:username
    Login With PIN
    Logout
    [Teardown]    Close Browser

Data Persistence
    [Tags]  data-persistence
    Open Application
    Login With PIN
    Add Task
    Logout
    Sleep   10
    Login With PIN
    Verify Data Persisted
    [Teardown]    Close Browser

Move Task
    [Tags]  move-task
    Open Application
    Login With PIN
    Add Task    ${MOVE_TASK_TITLE}
    Move Task
    [Teardown]    Close Browser

Drag Drop Task
    [Tags]  drag-drop
    Open Application
    Login With PIN
    Add Task    ${DRAG_TASK_TITLE}
    Drag Drop    ${DRAG_TASK_TITLE}
    [Teardown]    Close Browser

Data Segregation
    [Tags]  data-seg
    Open Application
    Login With PIN
    Add Task
    Logout
    Open Application
    Segregation Flow
    [Teardown]    Close Browser

Calendar View
    [Tags]  calendar
    Open Application
    Login With PIN
    Add Task
    Go To Calendar Page
    Calendar Task Verify    ${TASK}     {Date}
    Change Task Due Date From Calendar  ${Task}    ${Date}    ${NewDate}
    Verify Task Not In Old Date     ${Task}
    [Teardown]    Close Browser

*** Keywords ***
Open Application
    open browser    ${URL}      ${browser}
    maximize browser window
    Wait Until Element Is Visible   xpath://a[@class='inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2']    10s
    Click Element   xpath://a[@class='inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2']
    Wait Until Location Contains    /login      timeout=10s
 
 Sign Up User
    Wait Until Page Contains    Set up your account    10s
    Wait Until Element Is Visible   xpath://a[normalize-space()='Set up your account']    10s
    Click Element   xpath://a[normalize-space()='Set up your account']
    Wait Until Page Contains    Set Up Task Line    10s
    Input Text      id:username   ${USERNAME}
    Input Text      xpath://input[@id='pin']   ${PINCODE}
    Input Text      xpath://input[@id='confirmPin']    ${PINCODE}
    Click Element   xpath://button[normalize-space()='Set Up Account']
    Wait Until Location Contains    /app    timeout=10s

 Login With PIN
    Wait Until Page Contains    Welcome Back    10s
    Wait Until Element Is Visible    id:username    10s
    Input Text    id:username   ${USERNAME}
    Sleep    0.5s
    Wait Until Element Is Visible    xpath://input[@id='pin']    10s
    Input Text    xpath://input[@id='pin']    ${PINCODE}
    Sleep    0.5s
    Wait Until Element Is Enabled    xpath://button[normalize-space()='Unlock App']    10s
    Sleep    0.3s
    Click Button    xpath://button[normalize-space()='Unlock App']
    Wait Until Location Contains    /app    timeout=10s

Add Task
    [Arguments]    ${title}=${TASK}    ${description}=${Describe}
    Click Element   xpath://a[normalize-space()='List']
    Skip Tutorial If Present
    Wait Until Page Contains    New Task    10s
    Click Element   xpath://button[normalize-space()='New Task']
    Wait Until Element Is Visible    xpath://input[@id='task-title']    10s
    Input Text  xpath://input[@id='task-title']     ${title}
    Input Text      id:task-description     ${description}
    Skip Tutorial If Present
    Click Button    id:task-priority
    Input Text    id:task-due-date     ${Date}
    Input Text    id:task-estimate      ${time}
    Click Button  xpath://button[normalize-space()='Create Task']

Edit Existing Task
    Click Element       xpath://a[normalize-space()='List']
    Skip Tutorial If Present
    Wait Until Page Contains    Tasks    10s
    Click Element    xpath://button[@data-tutorial='task-item-edit-button']//*[name()='svg']
    Wait Until Page Contains Element    xpath://input[@id='task-title']    10s
    Click Element       xpath://input[@id='task-title']
    Clear Element Text      xpath://input[@id='task-title']
    Input Text      css:#task-title    ${Taskadd}
    Click Button        xpath://button[normalize-space()='Update Task']

Delete Task
    Click Element   xpath://a[normalize-space()='List']
    Skip Tutorial If Present
    Wait Until Page Contains    Tasks    10s
    Click Element   xpath://button[@data-tutorial='task-item-delete-button']
    Click Element   xpath://button[normalize-space()='Delete']

Toggle DarkLight
    Skip Tutorial If Present
    Click Element   xpath://a[normalize-space()='Settings']
    Wait Until Page Contains    Customize how Task Line looks and feels    10s
    Click Element   xpath://div[normalize-space()='Dark']
    Click Element   xpath://button[normalize-space()='Save Settings']
    Handle Alert    action=ACCEPT
    Click Element   xpath://a[normalize-space()='Settings']
    Wait Until Page Contains    Customize how Task Line looks and feels    10s
    Click Element   xpath://div[normalize-space()='Light']
    Click Element   xpath://button[normalize-space()='Save Settings']
    Handle Alert    action=ACCEPT
    Click Element   xpath://a[normalize-space()='Settings']
    Wait Until Page Contains    Customize how Task Line looks and feels    10s
    Click Element   xpath://div[normalize-space()='Auto']
    Click Element   xpath://button[normalize-space()='Save Settings']
    Handle Alert    action=ACCEPT

Logout
    Click Element    xpath=/html/body/div/div/aside/div/section/div/button

Verify Data Persisted
    Click Element       xpath://a[normalize-space()='List']
    Skip Tutorial If Present
    Wait Until Page Contains    ${TASK}    10s
    Log    Task persisted after logout and relogin

Move Task
    Click Element   xpath://a[normalize-space()='Board']
    Skip Tutorial If Present
    Wait Until Page Contains    Task Board    10s
    Wait Until Element Is Visible    xpath://div[.//button[contains(text(),'Move Forward →')]]//button[contains(text(),'Move Forward →')]    10s
    Click Button   xpath://div[.//button[contains(text(),'Move Forward →')]]//button[contains(text(),'Move Forward →')]

Drag Drop
    [Arguments]    ${task_title}=${TASK}
    Click Element   xpath://a[normalize-space()='Board']
    Skip Tutorial If Present
    Wait Until Page Contains    To Do  timeout=10s
    Wait Until Element Is Visible    xpath=//*[contains(normalize-space(.), '${task_title}')]    10s
    Drag and Drop   xpath=//*[contains(normalize-space(.), '${task_title}')]    xpath://h3[normalize-space()='In Progress']
    
Segregation Flow
    Wait Until Page Contains    Set up your account    10s
    Wait Until Element Is Visible   xpath://a[normalize-space()='Set up your account']    10s
    Click Element   xpath://a[normalize-space()='Set up your account']
    Wait Until Page Contains    Set Up Task Line    10s
    Input Text      id:username     ${USERNAME1}
    Input Text      xpath://input[@id='pin']    ${PINCODE1}
    Input Text      xpath://input[@id='confirmPin']     ${PINCODE1}
    Click Element   xpath://button[normalize-space()='Set Up Account']
    Wait Until Location Contains    /app    timeout=10s
    Wait Until Element Is Visible   xpath://a[normalize-space()='List']    10s
    Click Element   xpath://a[normalize-space()='List']
    Skip Tutorial If Present
    Wait Until Page Contains    Tasks    10s
    Click Element   xpath://button[normalize-space()='New Task']
    Wait Until Element Is Visible    xpath://input[@id='task-title']    10s
    Input Text  xpath://input[@id='task-title']     ${TASK2}
    Input Text      id:task-description     ${Describe}
    Skip Tutorial If Present
    Click Button    id:task-priority
    Input Text    id:task-due-date     ${Date}
    Input Text    id:task-estimate      ${time}
    Click Button  xpath://button[normalize-space()='Create Task']
    Should Not Contain      ${TASK2}    ${TASK}

Skip Tutorial If Present
    ${tutorial_present}=    Run Keyword And Return Status    Wait Until Element Is Visible    xpath://button[@aria-label='Skip tutorial']    2s
    Run Keyword If    ${tutorial_present}    Click Button    xpath://button[@aria-label='Skip tutorial']
    Sleep    0.5s

Go To Calendar Page
    Click Element   xpath://a[normalize-space()='Calendar']
    Wait until page contains    Today
    
Calendar Task Verify
    [Arguments]    ${TASK}    ${Date}
    ${locator}=    Set Variable    xpath=//div[@data-tutorial='calendar-event']
    Wait Until Page Contains Element    ${locator}
    Log     Task '${TASK}' with due date '${Date}' is visible in calendar.

Change Task Due Date From Calendar
    [Arguments]    ${Task}    ${Date}    ${NewDate}
    Click Element    xpath=//div[contains(@data-tutorial,'calendar-event') and contains(.,'${Task}')]
    Sleep   10s
    Click Element   xpath://input[@id='task-due-date']
    Input Text  xpath=//input[@id='task-due-date']    ${NewDate}
    Click Button    xpath://button[normalize-space()='Update Task']
    Log To Console   Task '${Task}' due date changed from ${Date} to ${NewDate}.

Verify Task Not In Old Date
    [Arguments]    ${Task}
    ${locator}=    Set Variable    xpath=//div[@data-date='${Date}']//div[@data-tutorial='calendar-event' and contains(.,'${Task}')]
    Page Should Not Contain Element    ${locator}
    Log To Console  Task '${Task}' correctly not displayed in calendar.


