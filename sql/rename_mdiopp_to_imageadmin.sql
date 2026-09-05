/* ============================================================================
   Rename the MDIOpp role to ImageAdmin.  (corrected)

   The previous version assumed a `description` column on `roles`; there isn't
   one — the app only ever uses id, name, createdAt and updatedAt. This version
   touches `name` only.

   Roles are assigned through `user_roles` BY ID, so renaming the row carries
   every existing assignment with it: nobody loses access, nothing to reassign.

   This role governs FrontImage, which shares this user database. frontEnd2.0
   grants it no module access of its own.

   Safe to run more than once.
   ============================================================================ */


/* ---- 1. What the table actually looks like, and what's there now ---------- */
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE table_schema = DATABASE() AND table_name = 'roles'
ORDER BY ORDINAL_POSITION;

SELECT * FROM roles WHERE name IN ('MDIOpp', 'ImageAdmin');


/* ---- 2. Rename in place, keeping every assignment ------------------------- */
UPDATE roles SET name = 'ImageAdmin' WHERE name = 'MDIOpp';


/* ---- 3. If the role never existed, create it so it can be assigned -------- *
 * Only name is set. If your roles table has other NOT NULL columns without a
 * default, this INSERT will complain — the rename above is the important part,
 * and you can add the row through Admin -> Roles instead.
 */
INSERT INTO roles (name)
SELECT 'ImageAdmin'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ImageAdmin');


/* ---- 4. Verify: the role, and how many users carry it -------------------- */
SELECT r.id, r.name, COUNT(ur.userId) AS assigned_users
FROM roles r
LEFT JOIN user_roles ur ON ur.roleId = r.id
WHERE r.name IN ('MDIOpp', 'ImageAdmin')
GROUP BY r.id, r.name;


/* ---- 5. Who can sign into FrontImage once its auth checks ImageAdmin ------ */
SELECT u.id, u.username, u.name, u.active
FROM Users u
INNER JOIN user_roles ur ON ur.userId = u.id
INNER JOIN roles r ON r.id = ur.roleId
WHERE r.name = 'ImageAdmin'
ORDER BY u.username;
