# Security Specification: Luminary Photo

## Data Invariants
1. **Identity Integrity**: All documents (`users`, `albums`, `photos`) MUST have an `ownerId` field that matches the `request.auth.uid` of the creator.
2. **Relational Consistency**: A `Photo` can only be associated with an `albumId` that exists and is owned by the same user.
3. **Immutability**: `createdAt` and `ownerId` fields must never change after creation.
4. **Validation**: All string fields have strict size limits to prevent resource exhaustion (Denial of Wallet).
5. **Verified Access**: Writing data requires `email_verified == true`.

## The "Dirty Dozen" Payloads (Red Team Test Cases)
| ID | Collection | Action | Payload Description | Expectation |
|----|------------|--------|---------------------|-------------|
| 1 | `albums` | Create | `ownerId` set to another user's UID | `DENIED` |
| 2 | `albums` | Update | Change `ownerId` of existing album | `DENIED` |
| 3 | `albums` | List | Authenticated user listing all albums without `where(ownerId, ==, uid)` | `DENIED` (handled by rule) |
| 4 | `photos` | Create | `url` > 2048 chars | `DENIED` |
| 5 | `photos` | Create | `albumId` pointing to an album owned by another user | `DENIED` |
| 6 | `photos` | Create | `ownerId` matches user but `email_verified` is false | `DENIED` |
| 7 | `users` | Update | Attempting to change `email` field | `DENIED` |
| 8 | `photos` | Update | Deleting `ownerId` field | `DENIED` |
| 9 | `photos` | Create | `tags` array with 100 items | `DENIED` |
| 10 | `albums` | Update | Update `createdAt` to current time | `DENIED` |
| 11 | `photos` | Create | Document ID injected with non-alphanumeric characters | `DENIED` |
| 12 | `photos` | Create | `url` is a number instead of string | `DENIED` |

## Hardened Red Team Audit
- **Identity Spoofing**: Blocked by `isValidPhoto` / `isValidAlbum` ensuring `ownerId == request.auth.uid`.
- **State Shortcutting**: Not applicable as there's no complex state machine, but `createdAt` immutability is enforced.
- **Resource Poisoning**: Enforced `.size()` checks on all strings and arrays.
- **Query Trust test**: `allow list` explicitly checks `resource.data.ownerId == request.auth.uid`.
