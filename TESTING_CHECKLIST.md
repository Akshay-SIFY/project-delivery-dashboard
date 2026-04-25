# Testing Checklist

## 1) Team Members (Persistence + CRUD)
- [ ] Open Team page and add a new member (name + role).
- [ ] Confirm member appears immediately in UI.
- [ ] Refresh page and confirm member still exists.
- [ ] Edit that member's name/role.
- [ ] Confirm changes appear immediately in UI.
- [ ] Refresh page and confirm edits persist.
- [ ] Delete that member.
- [ ] Confirm member is removed immediately.
- [ ] Refresh page and confirm member remains deleted.

## 2) Tasks (Persistence + CRUD)
- [ ] Open Tasks page and add a new task with required fields.
- [ ] Confirm task appears immediately in UI.
- [ ] Refresh page and confirm task still exists.
- [ ] Edit task fields (title/status/assignees/dates).
- [ ] Confirm task updates immediately.
- [ ] Refresh page and confirm edits persist.
- [ ] Delete the task.
- [ ] Confirm task is removed immediately.
- [ ] Refresh page and confirm task remains deleted.

## 3) Projects (if enabled)
- [ ] Add/Edit/Delete project and verify immediate UI updates.
- [ ] Refresh after each operation and confirm persistence.

## 4) API Endpoints
- [ ] `GET /api/team` returns JSON array and HTTP 200.
- [ ] `POST /api/team` returns created member and HTTP 201.
- [ ] `PUT /api/team/:id` returns updated member and HTTP 200.
- [ ] `DELETE /api/team/:id` returns success JSON and HTTP 200.
- [ ] `GET /api/tasks` returns JSON array and HTTP 200.
- [ ] `POST /api/tasks` returns created task and HTTP 201.
- [ ] `PUT /api/tasks/:id` returns updated task and HTTP 200.
- [ ] `DELETE /api/tasks/:id` returns success JSON and HTTP 200.

## 5) Vercel Deployment
- [ ] In Vercel Project Settings → Environment Variables, set `DATABASE_URL`.
- [ ] Redeploy production build.
- [ ] Repeat Team and Task persistence checks on the live URL.
- [ ] Confirm no API 500 errors in Vercel Runtime Logs.

## 6) Local/CI Commands
- [ ] `npm install`
- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm run build`
