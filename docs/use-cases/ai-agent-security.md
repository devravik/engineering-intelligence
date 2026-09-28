# AI-Agent Security Review: Deterministic Vulnerability Detection

Engineering Intelligence provides deterministic security review and automated vulnerability prevention for AI coding agents. It prevents AI agents (Claude Code, Cursor, Codex, OpenCode, Cline) from generating critical vulnerabilities like missing authorization, SQL injection, command execution, and leaked secrets.

AI coding agents are vulnerable to generating insecure code because security is often an implicit, out-of-band requirement. While agents fulfill feature requests, they frequently forget the authorization checks, input validation, and boundary sanitization required for production systems.

---

## Security Vulnerabilities Caught by Engineering Intelligence

Engineering Intelligence scans codebases and pull requests against verified security rules:

### 1. Missing Authorization Checks (`API-001`)
* **The Vulnerability**: Creating mutating API endpoints (`POST`, `PUT`, `DELETE`) or Server Actions without role-based access control (RBAC) or tenant ownership validation.
* **The Risk**: Broken Object Level Authorization (BOLA / IDOR), allowing authenticated users to modify or delete another customer's data.
* **Detection**: AST analysis flags mutating endpoints lacking authorization middleware, session validation, or ownership verification.

### 2. SQL Injection via String Concatenation (`SEC-001`)
* **The Vulnerability**: Constructing database queries by concatenating variables or inserting template literals into SQL strings rather than using parameterized placeholders (`$1`, `?`).
* **The Risk**: Arbitrary database extraction, table dropping, and privilege escalation.
* **Detection**: Scans raw query calls in pg, mysql, prisma, and raw ORM clauses for dynamic template interpolations.

### 3. Command Injection (`SEC-002`)
* **The Vulnerability**: Passing unsanitized user arguments directly to system shells via `child_process.exec()`, `spawn()`, or `system()`.
* **The Risk**: Remote Code Execution (RCE) on the host server or container.
* **Detection**: Flags shell execution functions that accept dynamic string variables without strict whitelist validation.

### 4. Hardcoded Secrets & API Keys (`SEC-004`)
* **The Vulnerability**: Embedding live API keys, JWT secrets, private certificates, or test tokens directly into source code.
* **The Risk**: Credential exposure via source control leaks and public repositories.
* **Detection**: Regex and entropy-based credential scanning tailored for high-risk tokens (AWS, OpenAI, Anthropic, Stripe, database URLs).

---

## Installation

Add to your coding agent:

```bash
npx skills add devravik/engineering-intelligence
```

Or install the CLI for local security scans and CI pipelines:

```bash
npx @devravik/engineering-intelligence install
```

---

## Security Review Workflow

Run before every commit or deploy:

```bash
# Run security and architecture detectors on changed files
$ ei detect --changed

Engineering Intelligence

NEW  API-001   Missing authorization check on mutating endpoint
     src/routes/api/teams/delete.ts:18

NEW  SEC-001   SQL injection via dynamic template string
     src/db/queries/search.ts:32

2 findings

# Review findings with blast radius analysis
$ ei review

BLOCK
2 security issues detected. Fix required before ship.

# Gate enforcement
$ ei ship
BLOCK: UNKNOWN != PASS (Security issues must be resolved)
```

---

## Learn More

* [AI-Agent Database Review](ai-agent-database-review.md)
* [AI-Code Review Overview](ai-code-review.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
