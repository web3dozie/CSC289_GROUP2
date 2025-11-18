# End-to-End (E2E) Test Plan

**Document Version:** 1  
**Date:** October 10, 2025  
**Prepared by:** QA Team  
**Test Owner:** Natiza Dahal  
**Tooling:** Robot Framework + SeleniumLibrary  
**Test Type:** End-to-End (E2E) Testing  

---

## 1. Objective

The objective of this E2E Test Plan is to verify that the **Task Management System (TMS)** works seamlessly across all integrated modules — from user authentication and session management to task operations and UI interactions — in a real-world user flow.

E2E testing ensures the complete workflow functions correctly when all components interact as expected.

---

## 2. Scope

**In Scope:**
- User registration and login
- Session management (login, logout, autolock, unlock)
- CRUD operations on tasks (Create, Edit, Delete)
- UI-based interactions (theme toggle, drag & drop, move tasks)
- Data persistence and segregation validation across users

**Out of Scope:**
- API testing
- Performance/load testing
- Security and penetration testing

---

## 3. Test Environment

| Component | Description |
|------------|--------------|
| **Application URL** | `http://localhost:5173/` |
| **Browser** | Google Chrome (latest version) |
| **Database** | SQLite (Development Environment) |
| **Automation Tool** | Robot Framework |
| **Library** | SeleniumLibrary |
| **Operating System** | Windows 10 / 11 |

---

## 4. Test Data

| Variable | Description | Example |
|-----------|--------------|----------|
| `${USERNAME}` | Primary user for login and task creation | `testuser52` |
| `${PINCODE}` | PIN for primary user | `1234` |
| `${USERNAME1}` | Secondary user for data segregation test | `userA` |
| `${PINCODE1}` | PIN for secondary user | `987654` |
| `${TASK}` | Default task title | `Create User Story` |
| `${TASK2}` | Task for data segregation check | `Set an alarm` |
| `${Describe}` | Task description | `Please do it today` |
| `${Date}` | Task due date | `01022026` |
| `${time}` | Task estimate | `120` mins |

---

## 5. Test Scenarios and Flow

| Test Case ID | Test Case Name | Description | Expected Result |
|---------------|----------------|--------------|------------------|
| **TC01** | Create User Account | Verify new user account creation and redirection to app | User is redirected to `/app` after successful setup |
| **TC02** | Login to TMS | Validate login flow using correct username and PIN | User logs in and dashboard loads successfully |
| **TC03** | Logout from TMS | Verify logout functionality | User is logged out and redirected to login page |
| **TC04** | Create Task | Test task creation workflow | Task appears in the task list |
| **TC05** | Edit Task | Verify task can be edited | Updated task title and details are saved |
| **TC06** | Delete Task | Verify task deletion workflow | Task is removed from list |
| **TC07** | Toggle Theme | Verify switching between Dark/Light/Auto modes | Theme changes reflect correctly |
| **TC08** | Auto Lock Flow | Verify inactivity timeout triggers autolock | User session locks automatically after timeout |
| **TC09** | Unlock App | Validate unlocking app after autolock | App unlocks with correct PIN |
| **TC10** | Data Persistence | Ensure data persists after logout/login | Task data remains available post re-login |
| **TC11** | Move Task | Verify task moves between workflow stages | Task moves to the next status column |
| **TC12** | Drag and Drop Task | Validate drag-drop functionality on board | Task successfully drags and drops to "In Progress" |
| **TC13** | Data Segregation | Verify user-specific data isolation | UserB cannot see tasks created by UserA |
| **TC14** | Archive Task | Test archiving a task from main list | Task is archived and removed from main view |
| **TC15** | View Archived Tasks | Verify archived tasks appear in Archives view | Archived task is visible in Archives section |
| **TC16** | Restore Archived Task | Validate restoring archived task to main list | Task returns to main list after restore |

---

## 6. Test Execution Flow

1. **User Onboarding Flow**
   - `Create User Account`, `Login to TMS`, `Logout from TMS`
2. **Task Management Flow**
   - `Create Task`, `Edit Task`, `Delete Task`
3. **User Interface Flow**
   - `Toggle Theme`, `Move Task`, `Drag Drop Task`
4. **Session and Security Flow**
   - `Auto Lock Flow`, `Unlock App`
5. **Data Integrity Flow**
   - `Data Persistence`, `Data Segregation`

---

## 7. Entry Criteria

- Application is deployed and accessible at `${URL}`
- Test data and environment configured
- Browser drivers available and compatible
- All dependencies installed (SeleniumLibrary, Robot Framework)

---

## 8. Exit Criteria

- All E2E test cases executed
- All critical and major defects resolved
- Regression run completed after fixes

---

## 9. Deliverables

- E2E Test Plan (this document)
- Test Execution
- Test Report (Robot Framework HTML report)
- Defect Log (if any)

---

## 10. Risks and Mitigation

| Risk | Impact | Mitigation |
|-------|---------|-------------|
| Dynamic UI elements cause locator failure | High | Use stable locators (id, aria-label) or custom data attributes |
| Browser compatibility issues | Medium | Execute tests on Chrome first, extend to Firefox later |
| Test data not cleared between runs | Medium | Use unique usernames or database reset between runs |

---

## 11. References

- [Robot Framework Documentation](https://robotframework.org/)
- [SeleniumLibrary Keywords](https://robotframework.org/SeleniumLibrary/)
- *Project Repository:* https://github.com/web3dozie/CSC289_GROUP2

---
