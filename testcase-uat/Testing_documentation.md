# 📄 UAT Test Documentation – Task Management System (TMS)

## 1. Test Plan (UAT Scope)
- **Objective**: Validate that end users can log in to the TMS, add/edit/delete tasks, and toggle UI modes (Dark/Light).
- **In Scope**:
  - Login with 4-digit PIN
  - Task creation
  - Task editing
  - Task deletion
  - Dark/Light mode toggle
- **Out of Scope**: API testing, performance testing, backend DB validation.
- **Entry Criteria**:
  - Application is deployed and accessible at `http://localhost:5173/`.
  - Test data (PIN = `1234`, sample tasks) available.
- **Exit Criteria**:
  - All critical UAT test cases pass.
  - No high-priority defects remain open.

---

## 2. Test Environment
- **URL**: `http://localhost:5173/`
- **Browser**: Chrome (latest stable version)
- **Framework**: Robot Framework + SeleniumLibrary
- **OS**: Windows / MacOS (tester’s environment)

---

## 3. UAT Test Cases

### ✅ Test Case ID: UAT_TMS_001
**Title**: Verify Login with valid 4-digit PIN  
- **Precondition**: User is on login page.  
- **Steps**:  
  1. Open browser → navigate to `${URL}`  
  2. Enter PIN `${PINCODE}`  
  3. Click **Unlock**  
- **Expected Result**: User is redirected to TMS dashboard  

---

### ✅ Test Case ID: UAT_TMS_002
**Title**: Add a new task with category  
- **Precondition**: User is logged in  
- **Steps**:  
  1. Enter task title `${TASK}`  
  2. Select a category from dropdown (index 1)  
  3. Click **Add**  
- **Expected Result**: Task `Review PR` is added to the task list  

---

### ✅ Test Case ID: UAT_TMS_003
**Title**: Add another task with checkbox selection  
- **Precondition**: User is logged in  
- **Steps**:  
  1. Enter task title `${TASK2}`  
  2. Select category index `0`  
  3. Select checkbox  
  4. Click **Add**  
- **Expected Result**: Task `Set an alarm` is added with checkbox checked  

---

### ✅ Test Case ID: UAT_TMS_004
**Title**: Edit an existing task  
- **Precondition**: At least one task exists  
- **Steps**:  
  1. Click edit button for `Review PR`  
  2. Clear text and enter `${Taskadd}` (`Review PR today`)  
  3. Click **Save**  
- **Expected Result**: Task title is updated to `Review PR today`  

---

### ✅ Test Case ID: UAT_TMS_005
**Title**: Delete a task  
- **Precondition**: At least one task exists  
- **Steps**:  
  1. Click **Delete** button on a task  
  2. Accept confirmation alert  
- **Expected Result**: Task is removed from task list  

---

### ✅ Test Case ID: UAT_TMS_006
**Title**: Toggle Dark/Light mode  
- **Precondition**: User is logged in  
- **Steps**:  
  1. Click **Dark Mode** button  
  2. Click **Light Mode** button  
- **Expected Result**: UI theme changes (dark → light)  

---

## 4. Test Data
- **PIN**: `1234`  
- **Task 1**: `Review PR`  
- **Task 2**: `Set an alarm`  
- **Edited Task**: `Review PR today`

---

## 5. Defect Reporting
- Any failures will be logged in the defect tracking tool with:
  - Steps to reproduce
  - Expected vs. Actual result
  - Screenshots (if applicable)

---

## 6. UAT Sign-Off
- **Exit Report**: All critical tasks (login, task CRUD, UI toggle) pass
- **Business Approval**: Stakeholders sign off if no major defects remain
