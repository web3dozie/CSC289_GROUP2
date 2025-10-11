# Integration Test Plan

**Document Version:** 1.0  
**Date:** October 10, 2025  
**Prepared by:** QA Team  
**Test Owner:** Natiza Dahal  
**Tooling:** Robot Framework + SeleniumLibrary  
**Test Type:** Integration Test Suite  

---

## 1. Objective

The purpose of this Test Plan is to validate the integration of modules in the **Task Management System (TMS)**, ensuring that features work correctly when combined — including authentication, task management, user management, and persistence.  
This plan verifies the **end-to-end flow** and **data integrity** across the full stack (frontend, backend, and database).

---

## 2. Scope

### In Scope
- Authentication (Login, Logout, Auto-lock)
- Task lifecycle (Create, Edit, Delete, Complete)
- Multi-user workflows (data segregation)
- Data persistence across sessions/logouts
- UI–Backend communication
- Error handling and validation

### Out of Scope
- Performance / load testing
- Non-functional aspects (UI design, accessibility)
- Backend API unit testing (handled separately)

---

## 3. System Overview

The Task Management System allows users to:
- Log in using credentials (username + PIN)
- Create, view, edit, and delete tasks
- Drag and drop tasks
- Remain secure with auto-lock on inactivity

---

## 4. Test Environment

| Component | Description |
|------------|--------------|
| **OS** | Windows / macOS |
| **Browser** | Chrome (latest) |
| **Test Tool** | Robot Framework + SeleniumLibrary |
| **Test URL** | [http://localhost:5173/](http://localhost:5173/) |
| **Test Data** | Dummy accounts (UserA, UserB) |
| **Database** | Local instance or test environment |

---

## 5. Test Tools

- **Robot Framework** – Test automation framework  
- **SeleniumLibrary** – For UI interaction  
- **Browser Drivers** – ChromeDriver  

---

## 6. Entry & Exit Criteria

### Entry Criteria
- Build deployed successfully on test environment  
- Unit and smoke tests passed  
- All required modules (Auth, Tasks, DB) are stable  

### Exit Criteria
- 100% integration tests executed  
- 90%+ passed without major defects  
- Critical bugs resolved and verified  

---

## 7. Test Scenarios and Coverage

### A. Authentication Integration

| ID | Scenario | Expected Result |
|----|-----------|----------------|
| **A1** | User logs in with valid credentials | Redirected to dashboard |
| **A2** | User logs out | Redirected to login screen |
| **A3** | App auto-locks after 5 mins inactivity | Redirected to login screen |
| **A4** | User unlocks with same PIN | Session restored |

### B. Task Management Integration

| ID | Scenario | Expected Result |
|----|-----------|----------------|
| **T1** | Login → Create new task | Task visible on dashboard |
| **T2** | Edit existing task | Updated values shown immediately |
| **T3** | Delete task | Task removed from list |
| **T4** | Create multiple tasks | All display correctly |

### C. Multi-User Data Segregation

| ID | Scenario | Expected Result |
|----|-----------|----------------|
| **M1** | User A creates task | Only visible to User A |
| **M2** | User B logs in | Sees only their tasks |

### D. Data Persistence

| ID | Scenario | Expected Result |
|----|-----------|----------------|
| **P1** | Create task → Logout → Login again | Task remains visible |
| **P2** | Refresh browser after creating task | Task persists |
| **P3** | Clear session cookies → Login | Data retrieved from backend |

---

## 8. Test Data

| Field | Example Value |
|--------|----------------|
| **Username** | testuser / userA |
| **PIN** | 123456 |
| **Task Title** | Review PR |
| **Task Description** | Review pending pull requests |
| **Due Date** | 2025-10-15 |

---

## 9. Test Execution Plan

| Phase | Activity | Owner | Status |
|--------|-----------|--------|--------|
| **Phase 1** | Smoke test | QA | ✅ |
| **Phase 2** | Integration test (Auth + Task) | QA | ⏳ |
| **Phase 3** | Multi-user & persistence | QA | ⏳ |

---

## 10. Reporting

- Daily execution summary in **Test Report.html**  
- Defects logged in **Trello board**  
- Final QA Summary includes pass status, defects, and retests  

---

## 11. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|---------|-------------|
| Data overlap in multi-user | High | Use isolated test accounts |
| Flaky UI elements | Medium | Add waits & element checks |
| Auto-lock timer unreliable | Medium | Simulate inactivity carefully |

---

## 12. Deliverables

- ✅ **Integration Test Suite:** `tests/integration/`  
- ✅ **Test Plan Document:** `docs/TESTPLAN.md`  
- ✅ **Test Case Report:** `docs/TESTCASES.md`  
- ✅ **Execution Report:** Robot `log.html` + `report.html`  
- ✅ **Updated README:** Setup & test instructions  

---

## 13. References

- [Robot Framework Documentation](https://robotframework.org)  
- [SeleniumLibrary Guide](https://robotframework.org/SeleniumLibrary)  
- **Project Repository:** https://github.com/web3dozie/CSC289_GROUP2

---
