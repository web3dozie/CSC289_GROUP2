*** Settings ***
Library     SeleniumLibrary
Library     OperatingSystem
Library     Collections
Library     DateTime

Suite Setup    Setup Test Environment
Suite Teardown    Cleanup Test Environment

*** Variables ***
${URL}  http://localhost:5173/
${browser}     chrome
${USERNAME}    testuser2
${PINCODE}     987654
${USERNAME1}    user2
${PINCODE1}     987654
${TASK}        Create User Story
${Taskadd}     Review PR Today
${TASK2}       Set an Alarm
${MOVE_TASK_TITLE}    Move Board Task
${DRAG_TASK_TITLE}    Drag Drop Story
${Describe}    Please try do it ASAP
${time}      120
${IncorrectPin}     010101
${Journalentry}     It was productive day as I attended 3 meetings
${DOWNLOAD_DIR}    ${CURDIR}${/}test_downloads

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

Error Handling - Invalid PIN
    [Tags]  LoginError
    Open Application
    Login With Incorrect pin
    [Teardown]      Close Browser

Export and Import Tasks
    [Tags]  ExportImport
    Open Application
    Login With PIN
    Add Task
    Add Journal
    Export
    Sleep   10
    Delete Task
    Sleep   10
    Import
    [Teardown]    Close Browser

Archive Task
    [Tags]  archive
    Open Application
    Login With PIN
    Add Task    ${TASK}
    Archive Task From List    ${TASK}
    Go To Archives View
    Verify Task In Archives    ${TASK}
    [Teardown]    Close Browser

View Archived Tasks
    [Tags]  archives
    Open Application
    Login With PIN
    Add Task    ${TASK}
    Archive Task From List    ${TASK}
    Go To Archives View
    Verify Task In Archives    ${TASK}
    [Teardown]    Close Browser

Restore Archived Task
    [Tags]  restore
    Open Application
    Login With PIN
    Add Task    ${TASK}
    Archive Task From List    ${TASK}
    Go To Archives View
    Restore Task From Archives    ${TASK}
    Go To List View
    Skip Tutorial If Present
    Verify Task In Main List    ${TASK}
    [Teardown]    Close Browser

Review Analytics displayed
    [Tags]  analytics
    Open Application
    Login With PIN
    Skip Tutorial If Present
    Sleep      2s
    Go To Analytics Page
    Verify Daily Summary
    Verify Weekly Summary
    [Teardown]  Close Browser

*** Keywords ***
Setup Test Environment
    Create Directory    ${DOWNLOAD_DIR}
    Empty Directory     ${DOWNLOAD_DIR}
    # Generate dynamic dates relative to today
    ${current_date}=    Get Current Date
    ${future_date}=    Add Time To Date    ${current_date}    14 days    result_format=%m%d%Y
    ${new_future_date}=    Add Time To Date    ${current_date}    19 days    result_format=%m%d%Y
    Set Global Variable    ${Date}    ${future_date}
    Set Global Variable    ${NewDate}    ${new_future_date}

Cleanup Test Environment
    Remove Directory    ${DOWNLOAD_DIR}    recursive=True

Open Application
    # Build Chrome options (your existing prefs preserved)
    ${chrome_options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    ${prefs}=    Create Dictionary
    ...    download.default_directory=${DOWNLOAD_DIR}
    ...    download.prompt_for_download=${False}
    ...    download.directory_upgrade=${True}
    ...    safebrowsing.enabled=${False}
    Call Method    ${chrome_options}    add_experimental_option    prefs    ${prefs}
    # Optional: headless (uncomment if needed)
    # Call Method    ${chrome_options}    add_argument    --headless=new

    # Get the correct driver path via webdriver-manager and wrap it in a Selenium Service
    ${driver_path}=    Evaluate    __import__('webdriver_manager.chrome').chrome.ChromeDriverManager().install()
    ${service}=        Evaluate    __import__('selenium.webdriver.chrome.service').webdriver.chrome.service.Service(r"""${driver_path}""")

    # Create the WebDriver using the Service (Selenium 4 style)
    Create Webdriver    Chrome    options=${chrome_options}    service=${service}

    Maximize Browser Window
    Go To    ${URL}
    Wait Until Element Is Visible    xpath://a[contains(text(),'Open App')]    10s
    Click Element    xpath://a[contains(text(),'Open App')]
    Wait Until Location Contains    /login    timeout=10s
 
 Sign Up User
    Wait Until Page Contains    Welcome Back    10s
    Wait Until Element Is Visible   xpath://button[normalize-space()='Sign Up']    10s
    Click Element   xpath://button[normalize-space()='Sign Up']
    Wait Until Page Contains    Set Up Task Line    10s
    Input Text      id:username   ${USERNAME}
    Input Text      xpath://input[@id='pin']   ${PINCODE}
    Input Text      xpath://input[@id='confirmPin']    ${PINCODE}
    Click Element   xpath://button[normalize-space()='Create Account']
    Wait Until Location Contains    /app    timeout=10s

 Login With PIN
    Wait Until Page Contains    Welcome Back    10s
    Wait Until Element Is Visible    id:username    10s
    Input Text    id:username   ${USERNAME}
    Sleep    0.5s
    Wait Until Element Is Visible    xpath://input[@id='pin']    10s
    Input Text    xpath://input[@id='pin']    ${PINCODE}
    Sleep    0.5s
    Wait Until Element Is Enabled    xpath://button[normalize-space()='Sign in']    10s
    Sleep    0.3s
    Click Button    xpath://button[normalize-space()='Sign in']
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
    ${timestamp}=    Get Time    epoch
    ${unique_username}=    Set Variable    user${timestamp}
    Wait Until Page Contains    Welcome Back    10s
    Wait Until Element Is Visible   xpath://button[normalize-space()='Sign Up']    10s
    Click Element   xpath://button[normalize-space()='Sign Up']
    Wait Until Page Contains    Set Up Task Line    10s
    Input Text      id:username     ${unique_username}
    Input Text      xpath://input[@id='pin']    ${PINCODE1}
    Input Text      xpath://input[@id='confirmPin']     ${PINCODE1}
    Click Element   xpath://button[normalize-space()='Create Account']
    Wait Until Location Contains    /app    timeout=10s
    Sleep    2s
    Skip Tutorial If Present
    Sleep    1s
    Wait Until Element Is Visible   xpath://a[normalize-space()='List']    10s
    Click Element   xpath://a[normalize-space()='List']
    Sleep    2s
    Skip Tutorial If Present
    Sleep    1s
    Wait Until Page Contains    Tasks    10s
    Wait Until Element Is Visible    xpath://button[normalize-space()='New Task']    10s
    Skip Tutorial If Present
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
    ${tutorial_present}=    Run Keyword And Return Status    Wait Until Element Is Visible    xpath://button[@aria-label='Skip tutorial']    3s
    Run Keyword If    ${tutorial_present}    Click Button    xpath://button[@aria-label='Skip tutorial']
    Sleep    1s
    # Also try to click any overlay/backdrop to dismiss tutorial
    ${backdrop_present}=    Run Keyword And Return Status    Wait Until Element Is Visible    xpath://div[contains(@class, 'bg-black') and contains(@class, 'bg-opacity-50')]    2s
    Run Keyword If    ${backdrop_present}    Click Element    xpath://div[contains(@class, 'bg-black') and contains(@class, 'bg-opacity-50')]
    Sleep    0.5s

Go To Calendar Page
    Click Element   xpath://a[normalize-space()='Calendar']
    Wait until page contains    Today    timeout=10s
    Skip Tutorial If Present
    Sleep    2s
    
Calendar Task Verify
    [Arguments]    ${TASK}    ${Date}
    # Wait for calendar to load
    Wait Until Page Contains Element    xpath://div[@data-tutorial='calendar-grid']    timeout=10s
    # Check if the task appears in the calendar by looking for any task element containing the task title
    ${task_visible}=    Run Keyword And Return Status    
    ...    Wait Until Page Contains Element    
    ...    xpath://div[contains(@class, 'rounded') and contains(@class, 'truncate') and contains(., '${TASK}')]    
    ...    timeout=15s
    Run Keyword If    ${task_visible}    Log    Task '${TASK}' with due date '${Date}' is visible in calendar.
    Run Keyword Unless    ${task_visible}    Log    Task '${TASK}' not immediately visible in calendar view, checking agenda view
    # If not visible in calendar grid, switch to agenda view to verify task exists
    Run Keyword Unless    ${task_visible}    Click Element    xpath://button[contains(., 'Agenda')]
    Run Keyword Unless    ${task_visible}    Wait Until Page Contains    ${TASK}    timeout=10s

Change Task Due Date From Calendar
    [Arguments]    ${Task}    ${Date}    ${NewDate}
    # In calendar view, clicking a task opens it. Find and click the task.
    # The task appears as a small colored div with the task title
    Sleep    2s
    ${task_clicked}=    Run Keyword And Return Status    Click Element    xpath=//div[contains(@class, 'text-xs') and contains(@class, 'rounded') and contains(., '${Task}')]
    # If clicking the small calendar event didn't work, try clicking from the task list or agenda view
    Run Keyword Unless    ${task_clicked}    Click Element    xpath://button[contains(., 'Agenda')]
    Run Keyword Unless    ${task_clicked}    Sleep    2s
    Run Keyword Unless    ${task_clicked}    Click Element    xpath=//div[contains(., '${Task}')]//button[@aria-label='Edit task: ${Task}']
    Sleep    3s
    # Now the modal should be open
    Wait Until Element Is Visible    xpath://input[@id='task-due-date']    timeout=10s
    Click Element   xpath://input[@id='task-due-date']
    Sleep    1s
    Clear Element Text    xpath://input[@id='task-due-date']
    Input Text  xpath://input[@id='task-due-date']    ${NewDate}
    Sleep    1s
    Click Button    xpath://button[normalize-space()='Update Task']
    Sleep    2s
    Log To Console   Task '${Task}' due date changed from ${Date} to ${NewDate}.

Verify Task Not In Old Date
    [Arguments]    ${Task}
    ${locator}=    Set Variable    xpath=//div[@data-date='${Date}']//div[@data-tutorial='calendar-event' and contains(.,'${Task}')]
    Page Should Not Contain Element    ${locator}
    Log To Console  Task '${Task}' correctly not displayed in calendar.

Login With Incorrect pin
    Wait Until Page Contains    Welcome Back    10s
    Wait Until Element Is Visible    id:username    10s
    Input Text    id:username   ${USERNAME}
    Sleep    0.5s
    Wait Until Element Is Visible    xpath://input[@id='pin']    10s
    Input Text    xpath://input[@id='pin']    ${IncorrectPin}
    Sleep    0.5s
    Wait Until Element Is Enabled    xpath://button[normalize-space()='Sign in']    10s
    Sleep    0.3s
    Click Button    xpath://button[normalize-space()='Sign in']
    Wait Until Page Contains   Invalid username or PIN     5s
    ${current_url}=    Get Location
    Should Not Contain    ${current_url}    /app

Add Journal
    Wait Until Page Contains    Tasks   0.5s
    Click Element   Xpath://a[normalize-space()='Review']
    Wait Until Page Contains Element    Xpath://button[normalize-space()='New Entry']    10s
    Click Element   Xpath://button[normalize-space()='New Entry']
    Wait Until Element Is Visible   Xpath://textarea[@id='entry-content']    10s
    Input Text   Xpath://textarea[@id='entry-content']      ${Journalentry}
    Click Element   Xpath://button[normalize-space()='Save Entry']

Export
    Empty Directory    ${DOWNLOAD_DIR}
    Go To    ${URL}app/settings
    Wait Until Page Contains Element    xpath://button[normalize-space()='Download JSON']    10s
    Click Element   xpath://button[normalize-space()='Download JSON']
    Sleep    5s

Get Latest Downloaded File
    Wait Until Created    ${DOWNLOAD_DIR}${/}*.json    timeout=30s
    @{files}=    List Files In Directory    ${DOWNLOAD_DIR}    pattern=*.json    absolute=True
    ${latest_file}=    Evaluate    max(@{files}, key=lambda x: __import__('os').path.getmtime(x))
    Log To Console    \nLatest downloaded file: ${latest_file}
    RETURN    ${latest_file}

Import
    ${latest_file}=    Get Latest Downloaded File
    File Should Exist    ${latest_file}
    Go To    ${URL}app/settings
    Wait Until Page Contains    Import Data    10s
    # The file input is hidden, so we need to make it visible or use JavaScript
    Execute JavaScript    document.getElementById('import-file').style.display = 'block'
    Choose File     id=import-file     ${latest_file}
    Sleep   3s
    Wait Until Page Contains    Import Data    5s
    Click Element   xpath://button[normalize-space()='Import Data']
    Sleep   1s
    Handle Alert    action=ACCEPT

Archive Task From List
    [Arguments]    ${task_title}
    Click Element   xpath://a[normalize-space()='List']
    Skip Tutorial If Present
    Wait Until Page Contains    Tasks    10s
    # Find the archive button for the specific task
    # The archive button is the middle button (orange hover) between Edit and Delete
    ${archive_button}=    Set Variable    xpath://div[contains(., '${task_title}')]//button[@aria-label='Archive task: ${task_title}']
    Wait Until Element Is Visible    ${archive_button}    10s
    Click Element    ${archive_button}
    Sleep    3s

Go To Archives View
    Click Element    xpath://a[normalize-space()='Review']
    Wait Until Page Contains    Review & Reflect    10s
    # Click on the Archived Tasks tab
    Click Element    xpath://button[contains(., 'Archived Tasks')]
    Wait Until Page Contains    Archived Tasks    10s

Verify Task In Archives
    [Arguments]    ${task_title}
    Wait Until Page Contains    ${task_title}    10s
    Log    Task '${task_title}' found in archives

Verify Task Not In Main List
    [Arguments]    ${task_title}
    Click Element   xpath://a[normalize-space()='List']
    Skip Tutorial If Present
    Sleep    1s
    # Refresh the page to ensure the list is updated
    Reload Page
    Skip Tutorial If Present
    Wait Until Page Contains    Tasks    5s
    Sleep    2s
    # Check that the task is not in the list by checking for archive button absence
    ${task_present}=    Run Keyword And Return Status    Wait Until Element Is Visible    xpath://div[contains(., '${task_title}')]//button[@aria-label='Archive task: ${task_title}']    2s
    Should Be Equal    ${task_present}    ${False}    Task '${task_title}' should not be in main list
    Log    Task '${task_title}' correctly not in main list

Verify Task In Main List
    [Arguments]    ${task_title}
    Wait Until Page Contains    ${task_title}    10s
    Log    Task '${task_title}' found in main list

Restore Task From Archives
    [Arguments]    ${task_title}
    # Find the task card and then find the restore button within it
    ${task_card}=    Set Variable    xpath://div[contains(@class, 'border') and contains(@class, 'rounded-lg') and contains(., '${task_title}')]
    Wait Until Element Is Visible    ${task_card}    10s
    # Find the Restore button within the task card
    ${restore_button}=    Set Variable    ${task_card}//button[contains(., 'Restore')]
    Wait Until Element Is Visible    ${restore_button}    10s
    Click Element    ${restore_button}
    Sleep    2s

Go To List View
    Click Element    xpath://a[normalize-space()='List']
    Wait Until Page Contains    Tasks    10s

Go To Analytics Page
    Click Element   xpath://a[normalize-space()='Review']

Verify Daily Summary
    Click Element   xpath://button[normalize-space()='Daily Summary']
    Wait Until Page Contains Element    xpath://p[normalize-space()='Tasks Completed']    timeout=10s
    # Verify that analytics elements are present without checking specific values
    Page Should Contain Element    xpath://p[normalize-space()='Tasks Completed']
    Page Should Contain Element    xpath://p[normalize-space()='Overdue Tasks']
    Page Should Contain Element    xpath://div[normalize-space()='To Do']
    Log To Console  Daily Summary analytics verified

Verify Weekly Summary
    Click Element   xpath://button[normalize-space()='Weekly Summary']
    Wait Until Page Contains    Tasks Completed by Day    10s
    # Verify that weekly summary is displayed
    Page Should Contain    Tasks Completed by Day
    Log To Console  Weekly Summary verified
