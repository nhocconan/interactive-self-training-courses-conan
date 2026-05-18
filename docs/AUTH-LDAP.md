# LDAP / Active Directory integration

The portal supports Active Directory on **Windows Server 2019** (and any
RFC-4511 LDAP server) for single sign-on. Admins configure the integration
entirely from the UI — no code change required.

There are two flows:

1. **Login-time provisioning** — a user types AD credentials at `/login`,
   the portal binds against AD, and if successful creates / refreshes the
   local user.
2. **Admin-driven provisioning** — an admin opens `/admin/ldap/sync`,
   searches the configured sub-tree(s), and picks specific users to add.
   No password ceremony needed; the new users can sign in immediately with
   their AD password.

## 1 · Where to configure

Sign in as Admin → **LDAP / AD config** (`/admin/ldap`).

| Field                  | Example                                                        |
|------------------------|----------------------------------------------------------------|
| Server URL             | `ldap://dc01.demo.local:389` (or `ldaps://…:636`)            |
| Base DN                | `DC=demo,DC=local`                                           |
| Bind DN (service)      | `CN=svc-lms,OU=Service,DC=demo,DC=local`                     |
| Bind password          | (write-only)                                                   |
| User search filter     | `(|(sAMAccountName={username})(userPrincipalName={username}))` |
| **Picker sub-tree(s)** | `OU=Employees,DC=demo,DC=local` (one per line)               |
| Email attribute        | `mail`                                                         |
| Name attribute         | `displayName`                                                  |
| Department attribute   | `department`                                                   |
| Title attribute        | `title`                                                        |
| Default role for new LDAP users | `USER`                                                |
| Use StartTLS           | ☑️ (recommended)                                               |
| **Nightly attribute sync** | ☑️ (optional)                                              |

Click **Test connection** to verify the service bind, then **Save**.

## 2 · Sub-tree picker (admin-driven add)

Open **Admin → AD user picker** (`/admin/ldap/sync`).

1. The page lists each configured sub-tree (or the Base DN if none).
2. Type any fragment of a name, email, or username into the search box.
3. Pick a role for each row and click **Add** — the user is provisioned
   with `source = LDAP`, the **DN** is recorded, and they receive a
   `COURSE_ASSIGNED`-style notification when an admin later grants courses.

The same page lists every LDAP-sourced user with their last sync time, and
exposes a **Run sync now** button that re-fetches `name / department /
title` for every active LDAP user from the directory.

## 3 · Login-time provisioning

If a user has not been added by an admin, the first login still works:

1. The user enters `sAMAccountName` (or email) + password.
2. The portal first tries the **local user store**. If a local password matches,
   the user is signed in immediately — useful for break-glass admin access.
3. If LDAP is enabled and no local match was made, the portal:
   - opens a connection to your DC,
   - binds with the service account,
   - searches for the user with your filter,
   - re-binds as that user with the supplied password.
4. The email domain is checked against **Site Security → Allowed email domains**;
   bind succeeds but the login is rejected if the domain isn't allowlisted.
5. On success it **just-in-time provisions** or updates a local `User` row
   (`source = LDAP`) so HR / Admin can grant permissions to that account.

> A user who exists in LDAP can never log in as `LOCAL`; they get `source=LDAP`
> the first time they sign in. Their password is **never** stored locally.

## 4 · Required AD setup

1. Create a **read-only service account** (e.g. `svc-lms`). It only needs
   `Read` permission under the OU(s) listed under Base DN / Picker sub-trees.
2. (Recommended) Issue a server certificate to your DC and force **StartTLS**.
3. Open the firewall to the portal's host on tcp/389 (LDAP) or tcp/636 (LDAPS).

## 5 · Mapping AD groups to roles (Admin / HR)

Out-of-the-box, every LDAP user gets the **Default role** you choose in
Settings (typically `USER`). To make HR or Admin assignments persistent:

1. After the user signs in once (or is added via picker), an Admin elevates
   the role from **Users → Manage → Role**.
2. The next sign-in re-confirms the LDAP password but **keeps** the elevated
   role.

> If you want filter-based role mapping (e.g. members of `CN=LMS-Admins,…`
> auto-promoted), drop a feature request — the seam is `auth.ts → authorize()`.

## 6 · Periodic sync

When **Nightly attribute sync** is enabled, the **Run sync now** button (and
a future cron entry) iterates active LDAP-sourced users, re-fetches their
attributes by DN, and updates the local row. Disabled / removed users in AD
are *not* auto-disabled in the portal — an admin must do that manually.

## 7 · Troubleshooting

| Symptom                                  | Likely cause / fix                                  |
|------------------------------------------|-----------------------------------------------------|
| **Test connection** returns timeout       | Firewall blocked or wrong port                      |
| `bind failed` with valid creds            | `Bind DN` not in DN form, or service account locked |
| Picker returns 0 results                  | Wrong sub-tree DN, or filter excludes person objects |
| User logs in but no department           | Map a different attribute in `deptAttr`             |
| StartTLS fails                            | DC has no cert; switch to LDAPS or disable StartTLS |

## 8 · Security notes

- Bind password is stored in the DB (singleton `LdapConfig` row). Keep DB
  encrypted at rest.
- The portal never logs passwords. LDAP errors include the **message** but not
  the credential.
- Consider running the portal behind your VPN or zero-trust proxy so that
  LDAP is never directly exposed to the public internet.
