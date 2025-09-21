*** Settings ***
Library     SeleniumLibrary

*** Variables ***
${URL}  http://localhost:5173/
${browser}     chrome
${PINCODE}     1234
${TASK}        Review PR
${Taskadd}     Review PR today
${TASK2}       Set an alarm

*** Test Cases ***
Login To TMS
    function
*** Keywords ***
function
    open browser    ${URL}      ${browser}
    Sleep   3
    maximize browser window
    Sleep   3
    Click Element   xpath://input[@placeholder='4-digit PIN']
    Sleep   3
    Input Text   xpath://input[@placeholder='4-digit PIN']    ${PINCODE}
    Sleep   3
    Click Element   xpath://button[normalize-space()='Unlock']
    Sleep   3
    Click Element   xpath://input[@placeholder='Task title']
    Sleep   3
    Input Text      xpath://input[@placeholder='Task title']    ${Task}
    Sleep   3
    Click Element   xpath://form[@class='task-form']//select
    Sleep   3
    Select From List By Index   xpath://form[@class='task-form']//select   1
    Sleep   3
    Click Button    xpath://button[normalize-space()='Add']
    Sleep   3
    Click Element   xpath://input[@placeholder='Task title']
    Sleep   3
    Input Text      xpath://input[@placeholder='Task title']    ${TASK2}
    Sleep   3
    Click Element   xpath://form[@class='task-form']//select
    Sleep   3
    Select From List By Index   xpath://form[@class='task-form']//select   0
    Sleep   3
    Select Checkbox   xpath://input[@type='checkbox']
    Sleep   3
    Click Button    xpath://button[normalize-space()='Add']
    Sleep   3
    Click Element   xpath://li[2]//div[2]//button[2]
    Sleep   3
    Click Element   xpath://input[@value='Review PR']
    Sleep   3
    Clear Element Text  xpath://input[@value='Review PR']
    Sleep   3
    Click Element   xpath://li[contains(@class,'task')]//input
    Sleep   3
    Input Text      xpath://li[contains(@class,'task')]//input    ${Taskadd}
    Sleep   3
    Click Button    xpath://button[normalize-space()='Save']
    Sleep   3
    Click Element   xpath://button[normalize-space()='Delete']
    Sleep   3
    Handle alert    accept
    Sleep   3
    Click Button    xpath://button[normalize-space()='Dark Mode']
    Sleep   3
    Click Button    xpath://button[normalize-space()='Light Mode']
    Sleep   3
    Close Browser

