import { doc, writeBatch, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export const roleLabel = (role) =>
  role === 'superadmin' || role === 'master' ? 'Super Admin' : role === 'admin' ? 'Faculty Admin' : 'Trainee'

export const fullName = (u) => `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.email || 'this user'

export function setStatus(uid, status) {
  return updateDoc(doc(db, 'users', uid), { status, statusChangedAt: new Date().toISOString() })
}

export function setRole(uid, role) {
  return updateDoc(doc(db, 'users', uid), { role, status: 'active', roleChangedAt: new Date().toISOString() })
}

/**
 * Remove an account: its profile is deleted and the account is added to the
 * blacklist, so it can no longer use the portal. A copy of the profile is
 * kept on the blacklist entry so a Super Admin can revive it later.
 */
export async function removeAccount(user, removedBy) {
  const { id, ...profile } = user
  const uid = user.uid || id
  const batch = writeBatch(db)
  batch.set(doc(db, 'blacklist', uid), {
    uid,
    email: user.email || '',
    name: fullName(user),
    role: user.role || 'student',
    removedAt: new Date().toISOString(),
    removedBy: removedBy || '',
    profile,
  })
  batch.delete(doc(db, 'users', uid))
  await batch.commit()
}

export async function reviveAccount(entry) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'users', entry.uid), {
    ...(entry.profile || { uid: entry.uid, email: entry.email, role: entry.role }),
    uid: entry.uid,
    status: 'active',
    revivedAt: new Date().toISOString(),
  })
  batch.delete(doc(db, 'blacklist', entry.uid))
  await batch.commit()
}
