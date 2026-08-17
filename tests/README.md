# Tests

These are **logic-level unit tests**: they mock `@/lib/db` with a small
in-memory fake and mock `@/lib/auth/session` to inject a controlled "current
user" per test. They exist to pin down the authorization and atomicity
*contracts* described in the spec — they do not exercise real Postgres,
real transaction isolation, or real HTTP/cookie handling.

**Known limitation / next step:** before production, add an integration
suite that runs against a real (disposable/test) Postgres database — e.g. a
Neon branch or a local Postgres in CI — using the actual `$transaction`
semantics, to catch anything the in-memory fake can't (real row locking
under concurrent load in particular). The atomic-acceptance test here
proves the *guard logic* is correct (second acceptance is rejected once the
first has committed); it can't reproduce a genuine two-connection race the
way a real database under concurrent load can.

Run with `npm test`.
