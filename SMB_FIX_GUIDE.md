# SMB Share Permission Fix Guide

## Problem Diagnosis
✅ **Root can write** to the share  
✗ **App user (mrzasa) cannot write** to the share

**Root cause:** The SMB mount is owned by `root:root` but your Node.js app runs as user `mrzasa`.

## The Solution

### Step 1: Get your UID and GID
```bash
id mrzasa
```

Output will show something like:
```
uid=1000(mrzasa) gid=1000(mrzasa) groups=1000(mrzasa),...
```

### Step 2: Edit /etc/fstab

**Current line:**
```
//apcfs04/SHARED  /mnt/tdrive  cifs  credentials=/users/mrzasa/.smbcred,_netdev 0 0
```

**Updated line (use your actual UID/GID from step 1):**
```
//apcfs04/SHARED  /mnt/tdrive  cifs  credentials=/users/mrzasa/.smbcred,uid=1000,gid=1000,file_mode=0666,dir_mode=0777,_netdev 0 0
```

**What each option does:**
- `uid=1000` - Mount files as owned by user mrzasa
- `gid=1000` - Mount files as owned by mrzasa's group  
- `file_mode=0666` - **Files are read/write for owner, group, AND others** (rw-rw-rw-)
- `dir_mode=0777` - **Directories are read/write/execute for everyone** (rwxrwxrwx)

**Why 0666 and 0777?** CIFS mounts don't respect Unix permissions fully. These permissive settings ensure the Node.js process can write to files it creates.

### Step 3: Remount the share
```bash
sudo umount /mnt/tdrive
sudo mount -a
```

### Step 4: Verify the fix
```bash
ls -ld "/mnt/tdrive/FrontEndShared/Projects/P100026 - MDI Output"
```

**Before:** `drwxr-xr-x 2 root root ...`  
**After:** `drwxrwxr-x 2 mrzasa mrzasa ...`

### Step 5: Test write access as mrzasa
```bash
su - mrzasa
echo "test content" > "/mnt/tdrive/FrontEndShared/Projects/P100026 - MDI Output/test.txt"
cat "/mnt/tdrive/FrontEndShared/Projects/P100026 - MDI Output/test.txt"
rm "/mnt/tdrive/FrontEndShared/Projects/P100026 - MDI Output/test.txt"
```

Should work without errors!

## Common Issues After Remounting

### Issue: File created but cannot write content
**Symptom:** File appears in directory but is 0 bytes or write fails  
**Cause:** `file_mode` is too restrictive (e.g., 0644 or 0664)  
**Fix:** Use `file_mode=0666` in mount options

**Test:**
```bash
# As mrzasa
touch "/mnt/tdrive/FrontEndShared/Projects/P100026 - MDI Output/test.txt"
echo "hello" > "/mnt/tdrive/FrontEndShared/Projects/P100026 - MDI Output/test.txt"
cat "/mnt/tdrive/FrontEndShared/Projects/P100026 - MDI Output/test.txt"
```

If the `echo` command fails, your `file_mode` is wrong.

### Solution 3: Fix Windows Share Permissions

On the Windows server `apcfs04`:

1. **Share Permissions** (Right-click share → Properties → Sharing → Advanced Sharing → Permissions):
   - Add `Everyone` or your domain user
   - Grant `Full Control` or at least `Change`

2. **NTFS Security** (Right-click folder → Properties → Security):
   - Add your user or `Everyone`
   - Grant `Modify` or `Full Control`

### Solution 4: Use Fallback (TEMPORARY)

The app now automatically falls back to local storage when network share fails:

**Fallback location:**
```
~/mdi-output/
```
or
```
/users/mrzasa/mdi-output/
```

Files will be saved here with a warning message. You can manually copy them to the network share:

```bash
cp ~/mdi-output/*.txt "/mnt/tdrive/FrontEndShared/Projects/P100026 - MDI Output/"
```

### Solution 5: Run Diagnostic Script

```bash
./fix-smb-permissions.sh
```

This script will:
- Check if share is mounted
- Test write permissions
- Show current permissions
- Suggest specific fixes

## Testing

After applying any fix, test with:

```bash
touch "/mnt/tdrive/FrontEndShared/Projects/P100026 - MDI Output/test.txt"
```

If successful:
```bash
rm "/mnt/tdrive/FrontEndShared/Projects/P100026 - MDI Output/test.txt"
```

## Common Issues

### Issue: "Permission denied" even after remount
**Cause:** Windows share permissions
**Fix:** Check Windows share and NTFS permissions on `apcfs04`

### Issue: "No such file or directory"
**Cause:** Share not mounted or path doesn't exist
**Fix:** 
```bash
mount | grep tdrive  # Check if mounted
sudo mount -a        # Remount
```

### Issue: Files created but owned by root
**Cause:** Missing `uid=` mount option
**Fix:** Add `uid=$(id -u)` to mount options

## How the App Handles This

1. **Tries network share first**: Attempts to write to `/mnt/tdrive/...`
2. **Falls back to local**: If permission denied, saves to `~/mdi-output/`
3. **Shows warning**: Yellow notification in UI when fallback is used
4. **Logs location**: Shows exact file path in the notification

## Production Recommendation

For production, fix the mount options (Solution 1) so files go directly to the network share. The fallback is for development/debugging only.

## Need Help?

Contact your IT department or Windows admin for `apcfs04` to verify:
- Share permissions include your user
- NTFS permissions allow write access
- SMB version compatibility
