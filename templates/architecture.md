# Architecture & Layering Boundaries

## Architecture Paradigm
[e.g., Modular Monolith / Microservices / Clean Architecture / Event-Driven / Simple MVC]

## Layering & Boundary Rules
1. **Controllers / Route Handlers:** Responsible only for request parsing, input validation, and HTTP response formatting.
2. **Domain Services / Actions:** Contain business logic and multi-step transactions.
3. **Data Layer:** Direct database queries belong here. Do not introduce speculative repository interfaces unless supporting multiple concrete database engines.

## State Management
- **Server State:** [e.g., React Query, Server Components, Redis cache]
- **Client / Local State:** [e.g., Zustand, React useState, Redux Toolkit]

## Integration Boundaries
- **External Services:** [List third-party APIs like Stripe, Twilio, SendGrid and their wrapper locations]
- **Background Jobs:** [How async tasks or queues are scheduled and handled]
