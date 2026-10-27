# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

## This repo

- Don't health-check Joplin with a localhost request such as `/api/ping`: Joplin rejects any request whose `Host` doesn't match `APP_BASE_URL`, and logs every probe.
