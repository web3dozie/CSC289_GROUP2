# USER GUIDE FOR TASK MANAGEMENT SYSTEM

## INTRODUCTION
Welcome to **Task Management System**. The **Task Management System** is a web-based application that allows users to add, update, delete, and track tasks efficiently.

## PURPOSE OF USER GUIDE
This **User Guide** provides instructions to install, configure, and use the Task Management System locally.  
It helps users manage their daily tasks efficiently by creating, updating, and tracking tasks through a simple interface.

## SYSTEM OVERVIEW
The system is built using:

- **Frontend:** React  
- **Backend:** Python  
- **Database:** SQLite  

---

## HOW TO USE THE SYSTEM

Here are the guidelines along with the screenshots of the steps on how to use the system:

### Create account

1. Navigate to `http://localhost:5173/`

![alt text](image.png)  
2. Click **"Open App"**

![alt text](image-1.png)
3. The **"Welcome Back"** page appears.

![alt text](image-2.png)
4. For a new user, create an account by clicking **"Sign Up"**.

![alt text](image-3.png)
5. Click the **Username** field and type your username.  
   _Example: `testuser2`_

![alt text](image-4.png)
6. Click the **PIN Code** field, type your PIN code, and click **"Confirm PIN"**.

![alt text](image-5.png)
7. Click the eye icon to view your password.

![alt text](image-6.png)
8. Click **"Create Account"**.

![alt text](image-7.png)

---
### Tour guide
- Once you create an account or sign in, it will direct you to the **Home Page** and a quick tour guide pops up.

![alt text](image-8.png)  
  Click **"Next"** to go to the next step or **"Skip"** to skip the guide.

![alt text](image-9.png)

---

### Creating and Managing Tasks
1. To create a task, click **"List"**.

![alt text](image-10.png)
2. Click **"New Task"**.

![alt text](image-11.png)
3. Add:
   - Title  
   - Description  
   - Priority  
   - Due date  
   - Time estimate    
Then click **"Create Task"** after filling the required fields.
![alt text](image-12.png)
4. To edit a task, click the **edit icon**, make necessary changes, and click **"Update Task"**.

![alt text](image-13.png)
5. To archive a task, click the **archive icon**.

![alt text](image-14.png)
6. To move the created task according to the progress:
   - Click **"Move Forward →"** button to move ahead  
   - Click **"Move Back"** button to move it back.

![alt text](image-15.png)
7. To view the task in the calendar on its created date, click on the assigned date — the task should appear there.

![alt text](image-16.png)

---

### Reviewing Tasks
- Click **"Review"** button to view task summary.  
- To view **Daily Summary**, go to **"Daily Summary"** tab.

![alt text](image-17.png)  
- Click **"Weekly Summary"** to view weekly progress.

![alt text](image-18.png)

---

### Managing Archived Tasks
1. Click **"Archived Tasks"** to view archived tasks.
2. You can:
   - **Restore** a task by clicking **"Restore"**.
   - **Delete** a task permanently by clicking **"Delete"**.
   
![alt text](image-19.png)

---

### Deleting a Task
- Navigate to the delete button and click **"Delete"**.

![alt text](image-20.png)

---

### Settings
1. Click **"Settings"**.

![alt text](image-21.png)
2. To switch theme:
   - Click **"Dark"** for dark mode.
![alt text](image-22.png)
   - Click **"Clean and Bright Interface"** to change the theme.

![alt text](image-23.png)
3. To change auto-lock time:
   - Go to **Security** section and open the dropdown.
   - Example: Select **"15 minutes"** to set auto-lock to 15 minutes.

![alt text](image-24.png)
4. To test lock without waiting:
   - Click the **lock icon** — it will lock the screen immediately.

![alt text](image-25.png)
5. After auto-lock:
   - You’ll be redirected to the unlock page.
   - Enter your PIN code and click **"Unlock"**.

![alt text](image-26.png)

---

### Tutorial and Data Management
- To revisit the tutorial:
  - Go to **Settings** and click **"Start Tutorial"**.

![alt text](image-27.png)
- To **download** the tasks and saved settings:
  - Click **"Download JSON"** — it will download a JSON file.
![alt text](image-28.png)
- To **upload** the downloaded JSON file:
  - Click **"Upload JSON"**.

![alt text](image-29.png)
  - Then click **"Import Data"** and select the file.
  - This will restore your tasks and settings.

![alt text](image-30.png)

---


