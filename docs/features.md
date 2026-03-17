# Features

- Logic and UI decoupled
- Hook-based API
- Error handling
- Waiting state (no substantive SSE chunk yet)
- Thinking chain (TOC) support
  - Loading state
  - Duration display
  - Auto-collapse when long
  - Container directive for TOC UI
- Heartbeat > 3s shows loading
- Custom components via Provider (register/registerBatch)
- HOC for custom components:
  - Props parsing by directive type (container vs leaf)
  - SSE loading state, request2Agent, error boundary
  - AutoScrollToBottom component and option to disable
