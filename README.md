# Jira Overtime Calculator – Forge App

A Forge-based Jira application that calculates **overtime or undertime** per user based on expected working hours and logged work entries.  
The app fetches worklogs via the **Timetracker REST API** and generates a clean, auditable report directly inside Jira — without relying on external tools.

---

## Features

- 🔍 **Fetch user worklogs** using Timetracker REST API.
- 📅 **Configurable date range** start and end dates.
- 🧮 **Overtime calculation** based on:
  - Expected hours
  - Actual logged hours
  - Overtime/undertime difference
- 📊 **Report rendered directly inside Jira** using Forge UI.
- 🔐 Secure by default thanks to Forge's permission model.
