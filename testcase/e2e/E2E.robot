*** Settings ***
Library     SeleniumLibrary

*** Variables ***
${URL}  http://localhost:5173/
${browser}     chrome
${USERNAME}    testuser115
${PINCODE}     987654
${USERNAME1}    user115
${PINCODE1}     987654
${TASK}        Create User Story
${Taskadd}     Review PR Today
${TASK2}       Set an Alarm
${Describe}    Please try do it ASAP
${Date}     01022026
${time}      120
${timeout}  5m

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
    Log In With pin
    Logout

Data Persistence
    [Tags]  data-persistence
    Open Application
    Login With pin
    Add Task
    Logout
    Sleep   10
    Login With Pin
    Verify Data Persisted

Move Task
    [Tags]  move-task
    Open Application
    Login With pin
    Move Task

Drag Drop Task
    [Tags]  drag-drop
    Open Application
    Login With pin
    Drag Drop

Data Segregation
    [Tags]  data-seg
    Open Application
    Sleep   10
    Login With pin
    Sleep   10
    Add Task
    Sleep   10
    Logout
    Open Application
    Sleep   10
    Segregation Flow
    Sleep   10

Auto Lock Flow
    [Tags]      autolock-unlock
    Open Application
    Login With pin
    Wait For Auto Lock

*** Keywords ***
Open Application
    open browser    ${URL}      ${browser}
    maximize browser window
    Click Element   xpath://a[@class='inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2']
    Wait Until Location Contains    /login      timeout=10s
 
 Sign Up User
    Wait Until Page Contains    Set up your account    10s
    Click Element   xpath://a[normalize-space()='Set up your account']
    Wait Until Page Contains    Set Up Task Line    10s
    Input Text      id:username   ${USERNAME}
    Input Text      xpath://input[@id='pin']   ${PINCODE}
    Input Text      xpath://input[@id='confirmPin']    ${PINCODE}
    Click Element   xpath://button[normalize-space()='Set Up Account']
    Sleep   5s
    Wait Until Location Contains    /app    timeout=10s

 Login With PIN
    Wait Until Page Contains    Welcome Back    10s
    Input Text    id:username   ${USERNAME}
    Input Text    xpath://input[@id='pin']    ${PINCODE}
    Click Button    xpath://button[normalize-space()='Unlock App']
    Wait Until Location Contains    /app    timeout=10s

Add Task
    Click Element   xpath://a[normalize-space()='List']
    Wait Until Page Contains    New Task    10s
    Click Element   xpath://button[normalize-space()='New Task']
    Input Text  xpath://input[@id='task-title']     ${TASK}
    Input Text      id:task-description     ${Describe}
    Click Button    id:task-priority
    Input Text    id:task-due-date     ${Date}
    Input Text    id:task-estimate      ${time}
    Click Button  xpath://button[normalize-space()='Create Task']

Edit Existing Task
    Click Element       xpath://a[normalize-space()='List']
    Wait Until Page Contains    Tasks    10s
    Click Element       xpath=/html[1]/body[1]/div[1]/div[1]/div[1]/main[1]/div[1]/div[2]/div[1]/div[2]/article[1]/header[1]/div[2]/button[1]/*[name()='svg'][1]
    Wait Until Page Contains Element    xpath://button[normalize-space()='Edit']    10s
    Click Button    xpath://button[normalize-space()='Edit']
    Wait Until Page Contains Element    xpath://input[@id='task-title']    10s
    Click Element       xpath://input[@id='task-title']
    Clear Element Text      xpath://input[@id='task-title']
    Input Text      css:#task-title    ${Taskadd}
    Click Button        xpath://button[normalize-space()='Update Task']

Delete Task
    Click Element   xpath://a[normalize-space()='List']
    Wait Until Page Contains    Tasks    10s
    Click Element   xpath:/html[1]/body[1]/div[1]/div[1]/div[1]/main[1]/div[1]/div[2]/div[1]/div[2]/article[1]/header[1]/div[2]/button[1]/*[name()='svg'][1]/*[name()='circle'][1]
    Click Element   xpath://button[normalize-space()='Delete']
    Click Element   xpath://button[normalize-space()='Delete']

Toggle DarkLight
    Click Element   xpath://a[normalize-space()='Settings']
    Wait Until Page Contains    Appearance    10s
    Click Element   xpath://div[normalize-space()='Dark']
    Click Element   xpath://div[normalize-space()='Light']
    Click Element   xpath://div[normalize-space()='Auto']

Wait For Auto Lock
    Sleep   ${TIMEOUT}
    Wait Until Element Is Visible   id:pin  timeout=10s
    Input Text    id:pin         ${PINCODE}
    Click Button    xpath://button[normalize-space()='Unlock']
    Wait Until Location Contains    /app    timeout=10s
    Log    🔓 Successfully unlocked after auto lock

Logout
    Click Element    xpath=/html/body/div/div/aside/div/section/div/button

Verify Data Persisted
    Click Element       xpath://a[normalize-space()='List']
    Wait Until Page Contains    ${TASK}    10s
    Log    ✅ Task persisted after logout and relogin

Move Task
    Click Element   xpath://a[normalize-space()='Board']
    Wait Until Page Contains    Task Board    10s
    Click Button   xpath://div[.//button[contains(text(),'Move Forward →')]]//button[contains(text(),'Move Forward →')]

Drag Drop
    Click Element   xpath://a[normalize-space()='Board']
    Wait Until Page Contains    To Do  timeout=10s
    Drag and Drop   xpath=//*[contains(normalize-space(.), 'Create User Story')]    xpath://h3[normalize-space()='In Progress']
    
Segregation Flow
    Wait Until Page Contains    Set up your account    10s
    Click Element   xpath://a[normalize-space()='Set up your account']
    Wait Until Page Contains    Set Up Task Line    10s
    Input Text      id:username     ${USERNAME1}
    Input Text      xpath://input[@id='pin']    ${PINCODE1}
    Input Text      xpath://input[@id='confirmPin']     ${PINCODE1}
    Click Element   xpath://button[normalize-space()='Set Up Account']
    Wait Until Page Contains    Task Line    10s
    Sleep   10
    Click Element   xpath://a[normalize-space()='List']
    Wait Until Page Contains    Tasks    10s
    Click Element   xpath://button[normalize-space()='New Task']
    Input Text  xpath://input[@id='task-title']     ${TASK2}
    Input Text      id:task-description     ${Describe}
    Click Button    id:task-priority
    Input Text    id:task-due-date     ${Date}
    Input Text    id:task-estimate      ${time}
    Click Button  xpath://button[normalize-space()='Create Task']
    Should Not Contain      ${TASK2}    ${TASK}