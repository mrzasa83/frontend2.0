/* ============================================================================
   Rename the MDIOpp role to ImageAdmin.

   Roles are stored in `roles` and assigned through `user_roles` BY ID, so
   renaming the row carries every existing assignment with it — nobody loses
   access and no reassignment is needed.

   This role governs FrontImage, which shares this user database. frontEnd2.0
   grants it no module access of its own.

   Idempotent: safe to run more than once, and it won't abort if the role is
   already renamed or doesn't exist.
   ============================================================================ */

/* Before: what's there now */
SELECT id, name, description FROM roles WHERE name IN ('MDIOpp', 'ImageAdmin');

/* Rename in place, keeping assignments intact. */
UPDATE roles
SET name = 'ImageAdmin',
    description = CASE
      WHEN description IS NULL OR description = '' OR description LIKE '%MDI%'
        THEN 'Access to FrontImage (MDI image processing)'
      ELSE description
    END
WHERE name = 'MDIOpp';

/* If the role never existed, create it so it can be assigned. */
INSERT INTO roles (name, description)
SELECT 'ImageAdmin', 'Access to FrontImage (MDI image processing)'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ImageAdmin');

/* After: confirm the rename and see how many users carry it. */
SELECT r.id, r.name, r.description, COUNT(ur.userId) AS assigned_users
FROM roles r
LEFT JOIN user_roles ur ON ur.roleId = r.id
WHERE r.name IN ('MDIOpp', 'ImageAdmin')
GROUP BY r.id, r.name, r.description;

/* Who has it — the list that should be able to sign into FrontImage. */
SELECT u.id, u.username, u.name, u.active
FROM Users u
INNER JOIN user_roles ur ON ur.userId = u.id
INNER JOIN roles r ON r.id = ur.roleId
WHERE r.name = 'ImageAdmin'
ORDER BY u.username;
