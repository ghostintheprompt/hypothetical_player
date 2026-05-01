# Technical Audit: Employee Monitoring Software (Hubstaff/Workpuls)

## 1. The File-by-File Map (The "Snooping" Trail)

When a job is done, these are the exact paths you should purge. These files contain your activity history, screenshot metadata, and employer-specific tokens.

### A. Application Support (The "Brain")
*   **Path:** `~/Library/Application Support/Hubstaff` or `~/Library/Application Support/workpuls-agent`
*   **What's inside:** Local SQLite databases that log every app you opened and every window title you looked at.
*   **Action:** **DELETE** after every contract.

### B. Preferences (The "ID Card")
*   **Path:** `~/Library/Preferences/com.netsoft.Hubstaff.plist` or `~/Library/Preferences/com.workpuls.Agent.plist`
*   **What's inside:** Your login session tokens, employer ID, and settings (like how often it screenshots).
*   **Action:** **DELETE** to prevent the app from auto-logging into an old account.

### C. HTTP Storages (The "Cookie Jar")
*   **Path:** `~/Library/HTTPStorages/com.netsoft.Hubstaff`
*   **What's inside:** Binary cookies and networking cache. This tracks your connection history to their servers.
*   **Action:** **DELETE** for privacy.

### D. Browser IndexedDB (The "Deep Tracker")
*   **Path:** `~/Library/Application Support/Google/Chrome/[Profile]/IndexedDB/https_app.hubstaff.com_0.indexeddb.leveldb`
*   **What's inside:** Even if the desktop app is closed, the web dashboard stores tracking data in your browser.
*   **Action:** **DELETE** (or clear browser "Site Data" for hubstaff.com).

### E. Shared File List (The "Recent Memory")
*   **Path:** `~/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.ApplicationRecentDocuments/com.workpuls.agent.sfl4`
*   **What's inside:** A macOS-level list that tells the system you recently used this app.
*   **Action:** **DELETE** if you want the app to vanish from "Recent Apps" suggestions.

---

## 2. What Can Stay?
Technically, **nothing** needs to stay. These apps are not "drivers"—they are just high-level applications. 
*   **Apple Software:** Never delete anything in `~/Library/Containers/com.apple.*` unless you know exactly what it is.
*   **Your Projects:** `weirdo`, `hiddenbastard`, and `Codex` are safe; they don't interact with these trackers.

---

## 3. How to Cleanly "Offboard" (End of Contract)

When you finish a job, run these commands (or have an agent do it) to be 100% sure:

1.  **Stop the Daemon:**
    `launchctl unload ~/Library/LaunchAgents/com.netsoft.Hubstaff.plist` (If it exists).
2.  **Trash the App:** Move the `.app` from `/Applications` to Trash.
3.  **Wipe the Support Folders:**
    `rm -rf ~/Library/Application\ Support/Hubstaff`
    `rm -rf ~/Library/Application\ Support/workpuls-agent`
4.  **Clear the Preferences:**
    `rm ~/Library/Preferences/com.netsoft.Hubstaff.plist`
    `rm ~/Library/Preferences/com.workpuls.Agent.plist`

---

## 4. Technical Summary of Interaction
*   **Keyboard/Mouse:** They use `NSEvent.addGlobalMonitorForEvents` to detect activity. They don't record *which* key, just *that* a key was pressed.
*   **Screenshots:** They use `CGWindowListCreateImage` which captures everything on your GPU's frame buffer. 
*   **The "Hacker" Risk:** Because these apps have **Accessibility Permissions**, if a hacker breaches Hubstaff's servers and pushes a malicious update to the app, they would have total control over your Mac (the ability to click buttons, read your screen, and see your typing). This is why you should **uninstall** them when not actively under contract.

## 5. The Developer's Watchtower (Watching the Watcher)

Since you like to educate yourself, here are the three macOS tools you can use to verify exactly what these apps are doing in real-time:

### A. The TCC Database (Permissions)
MacOS stores all privacy "Allow" clicks in a database. You can see what Hubstaff is allowed to do by going to:
**System Settings > Privacy & Security > Accessibility** (and **Screen Recording**).
*   **Pro Tip:** Even if you delete the app, the "permission" sometimes stays in this list as a ghost. You can manually remove it by clicking the minus (-) button to ensure no future version can start with those rights automatically.

### B. Process Inspection (`lsof`)
While the app is running, you can see every single file it has open (including which logs it's writing to) by running this in your terminal:
`sudo lsof -p [PID of Hubstaff]`
*   This will show you the exact `.log` and `.db` files it's currently touching.

### C. Unified Logs (`log stream`)
You can watch the app talk to the system in real-time. Open Terminal and run:
`log stream --predicate 'process == "Hubstaff"'`
*   This will scroll through every system call the app makes, including when it requests a screenshot or checks your idle time.

## 6. Architectural Vulnerabilities & Privacy Workarounds

As a developer, you can exploit the "Lazy Architecture" of these apps to protect your privacy.

### A. The "SIGSTOP" Maneuver (The Ghost Freeze)
If you suspect the app is doing something in the background when it should be off, you can "freeze" the process at the kernel level without the app's internal "Watchdog" timer knowing it happened.
*   **Command:** `kill -STOP [PID]`
*   **Result:** The process stops dead in its tracks. It cannot capture the screen, log keys, or send data. To wake it up: `kill -CONT [PID]`.
*   **Vulnerability:** These apps usually only report "Idle" if they are *running* but seeing no input. If the process is frozen, the server just sees a "Connection Timeout," which looks like a network glitch rather than "Idling."

### B. Screen Capture "Blind Spots"
Most monitoring apps use the `Quartz Window Services` API.
*   **The Flaw:** They often only capture the "Active" space. If you use **macOS Spaces** (Mission Control), and you have your personal stuff on "Desktop 2" while Hubstaff is on "Desktop 1," many trackers struggle to capture the inactive space, or they only capture a black frame for the non-active monitor.
*   **The "Sharing Exclude" Vulnerability:** In your own apps, you can set `window.sharingType = .none` (on newer macOS versions). This tells the system that this window is "Private" and should be excluded from all screen captures. If you keep your personal notes in an app you built with this flag, Hubstaff will literally see a hole in the screenshot where your app is.

### C. The Local DB "Insecurity"
*   **The Flaw:** Most of these apps store their "to-be-uploaded" logs in a local SQLite database that is **not encrypted**.
*   **The Workaround:** You can open their local database (usually found in `Application Support`) using `sqlite3` and see exactly what logs are waiting to be uploaded. If you see it captured a window title you don't like, a clever dev can technically `DELETE FROM logs WHERE window_title LIKE '%Secret%';` before the app syncs to the server.

### D. User-Level Sandbox Limits
Unlike "Little Snitch" (which runs at the Network Extension/Kernel level), Hubstaff and Workpuls almost always run as **User Processes**. 
*   **The Flaw:** They cannot see inside folders you have restricted with macOS Permissions (like your `~/Documents` folder if you haven't given them "Full Disk Access").
*   **The Strategy:** **NEVER** grant these apps "Full Disk Access." Only give them "Accessibility" and "Screen Recording." This keeps your actual file system invisible to them.

---

**Final Conclusion:** You now have the full technical map. You know where they live, how they hook the OS, how they capture data, and how to exploit their architectural flaws for your privacy. 

**Status:** Machine Clean. Knowledge Complete.