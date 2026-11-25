// Firestore security rules tests. Run with:  npm test   (inside tests/firestore-rules)
// Uses the Firestore emulator via `firebase emulators:exec`.
import { test, before, after, beforeEach } from 'node:test'
import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing'
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, limit, addDoc,
} from 'firebase/firestore'

const OWNER = 'nadjibullahu@gmail.com'
let env

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'enota-rules-test',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  })
})
after(async () => { await env.cleanup() })

const ctx = (uid, email, verified = true) =>
  env.authenticatedContext(uid, { email, email_verified: verified }).firestore()
const anon = () => env.unauthenticatedContext().firestore()

async function seed(fn) {
  await env.withSecurityRulesDisabled(async (c) => fn(c.firestore()))
}

beforeEach(async () => {
  await env.clearFirestore()
  await seed(async (db) => {
    await setDoc(doc(db, 'users/admA'), { uid: 'admA', email: 'a@x.com', role: 'admin', status: 'active', faculty: ['MULTIMEDIA'] })
    await setDoc(doc(db, 'users/admP'), { uid: 'admP', email: 'p@x.com', role: 'admin', status: 'pending', faculty: ['MULTIMEDIA'] })
    await setDoc(doc(db, 'users/stu1'), { uid: 'stu1', email: 's1@x.com', role: 'student', status: 'active', faculty: ['MULTIMEDIA'], regNumber: 'KSP1' })
    await setDoc(doc(db, 'users/stu2'), { uid: 'stu2', email: 's2@x.com', role: 'student', status: 'active', faculty: ['PHOTOGRAPHY'], scope: ['PHOTOGRAPHY'], regNumber: 'KSP2' })
    // trainee of a department under MULTIMEDIA
    await setDoc(doc(db, 'users/stu3'), { uid: 'stu3', email: 's3@x.com', role: 'student', status: 'active', faculty: ['FILMMAKING'], scope: ['FILMMAKING', 'MULTIMEDIA'], regNumber: 'KSP3' })
    await setDoc(doc(db, 'courses/c1'), { title: 'Film', faculties: ['MULTIMEDIA', 'FILMMAKING'] })
    await setDoc(doc(db, 'courses/c2'), { title: 'Photo', faculties: ['PHOTOGRAPHY'] })
    await setDoc(doc(db, 'marks/m1'), { regNumber: 'KSP1', faculty: 'MULTIMEDIA', marks: { Film: 80 } })
  })
})

// ---- Super Admin bootstrap ----
test('owner can claim Super Admin once, only when verified', async () => {
  await assertFails(setDoc(doc(ctx('own', OWNER, false), 'system/superadmin'), { uid: 'own', email: OWNER }))
  await assertSucceeds(setDoc(doc(ctx('own', OWNER), 'system/superadmin'), { uid: 'own', email: OWNER }))
  // cannot be overwritten, even by the owner
  await assertFails(setDoc(doc(ctx('own', OWNER), 'system/superadmin'), { uid: 'own', email: OWNER }))
})
test('nobody else can claim Super Admin', async () => {
  await assertFails(setDoc(doc(ctx('evil', 'evil@x.com'), 'system/superadmin'), { uid: 'evil', email: 'evil@x.com' }))
})

// ---- registration ----
test('student self-registration is allowed only as active student', async () => {
  const db = ctx('new1', 'n1@x.com', false)
  await assertSucceeds(setDoc(doc(db, 'users/new1'), { uid: 'new1', email: 'n1@x.com', role: 'student', status: 'active' }))
})
test('cannot self-register as active admin or super admin', async () => {
  const db = ctx('new2', 'n2@x.com')
  await assertFails(setDoc(doc(db, 'users/new2'), { uid: 'new2', email: 'n2@x.com', role: 'admin', status: 'active' }))
  await assertFails(setDoc(doc(db, 'users/new2'), { uid: 'new2', email: 'n2@x.com', role: 'superadmin', status: 'active' }))
  await assertSucceeds(setDoc(doc(db, 'users/new2'), { uid: 'new2', email: 'n2@x.com', role: 'admin', status: 'pending' }))
})
test('cannot create a profile for someone else', async () => {
  await assertFails(setDoc(doc(ctx('x', 'x@x.com'), 'users/other'), { uid: 'other', email: 'x@x.com', role: 'student', status: 'active' }))
})
test('cannot promote yourself or change faculty', async () => {
  const db = ctx('stu1', 's1@x.com')
  await assertFails(updateDoc(doc(db, 'users/stu1'), { role: 'admin' }))
  await assertFails(updateDoc(doc(db, 'users/admP'), { status: 'active' }))
  await assertFails(updateDoc(doc(ctx('admP', 'p@x.com'), 'users/admP'), { status: 'active' }))
  await assertFails(updateDoc(doc(db, 'users/stu1'), { faculty: ['PHOTOGRAPHY'] }))
  await assertSucceeds(updateDoc(doc(db, 'users/stu1'), { phone: '123' }))
})

// ---- super admin powers ----
test('founder approves and promotes admins', async () => {
  await seed((db) => setDoc(doc(db, 'system/superadmin'), { uid: 'own', email: OWNER }))
  const db = ctx('own', OWNER)
  await assertSucceeds(updateDoc(doc(db, 'users/admP'), { status: 'active' }))
  await assertSucceeds(updateDoc(doc(db, 'users/admA'), { role: 'superadmin' }))
  // a promoted super admin can approve too
  await assertSucceeds(updateDoc(doc(ctx('admA', 'a@x.com'), 'users/stu2'), { status: 'active' }))
})
test('pending and unverified admins have no admin powers', async () => {
  await assertFails(getDocs(collection(ctx('admP', 'p@x.com'), 'users')))
  await assertFails(getDoc(doc(ctx('admA', 'a@x.com', false), 'users/stu1')))
})

// ---- users visibility ----
test('faculty admin reads only their faculty users', async () => {
  const db = ctx('admA', 'a@x.com')
  await assertSucceeds(getDoc(doc(db, 'users/stu1')))
  await assertFails(getDoc(doc(db, 'users/stu2')))
  await assertSucceeds(getDocs(query(collection(db, 'users'), where('faculty', 'array-contains-any', ['MULTIMEDIA']))))
  await assertFails(getDocs(collection(db, 'users')))
  // department trainees are visible to the parent faculty admin
  await assertSucceeds(getDoc(doc(db, 'users/stu3')))
  await assertSucceeds(getDocs(query(collection(db, 'users'), where('scope', 'array-contains-any', ['MULTIMEDIA']))))
  await assertFails(getDocs(query(collection(db, 'users'), where('scope', 'array-contains-any', ['PHOTOGRAPHY']))))
})
test('students cannot list users', async () => {
  await assertFails(getDocs(collection(ctx('stu1', 's1@x.com'), 'users')))
})

// ---- marks ----
test('public can look up marks by reg number but not dump the collection', async () => {
  await assertSucceeds(getDocs(query(collection(anon(), 'marks'), where('regNumber', '==', 'KSP1'), limit(50))))
  await assertFails(getDocs(collection(anon(), 'marks')))
  await assertFails(addDoc(collection(anon(), 'marks'), { regNumber: 'X', faculty: 'MULTIMEDIA' }))
})
test('faculty admin writes marks only in their faculty', async () => {
  const db = ctx('admA', 'a@x.com')
  await assertSucceeds(addDoc(collection(db, 'marks'), { regNumber: 'KSP9', faculty: 'MULTIMEDIA', faculties: ['MULTIMEDIA'] }))
  await assertFails(addDoc(collection(db, 'marks'), { regNumber: 'KSP9', faculty: 'PHOTOGRAPHY' }))
  await assertSucceeds(updateDoc(doc(db, 'marks/m1'), { marks: { Film: 85 } }))
  await assertFails(deleteDoc(doc(db, 'marks/m1')))
})

// ---- courses ----
test('students see only their faculty courses, and must be verified', async () => {
  const db = ctx('stu1', 's1@x.com')
  await assertSucceeds(getDocs(query(collection(db, 'courses'), where('faculties', 'array-contains-any', ['MULTIMEDIA']))))
  await assertSucceeds(getDoc(doc(db, 'courses/c1')))
  await assertFails(getDoc(doc(db, 'courses/c2')))
  await assertFails(getDocs(collection(db, 'courses')))
  await assertFails(getDoc(doc(ctx('stu1', 's1@x.com', false), 'courses/c1')))
})
test('faculty admin manages only their courses', async () => {
  const db = ctx('admA', 'a@x.com')
  await assertSucceeds(setDoc(doc(db, 'courses/c3'), { title: 'New', faculties: ['MULTIMEDIA'] }))
  await assertFails(setDoc(doc(db, 'courses/c4'), { title: 'New', faculties: ['PHOTOGRAPHY'] }))
  await assertFails(deleteDoc(doc(db, 'courses/c2')))
})

// ---- blacklist ----
test('blacklisted users lose access', async () => {
  await seed((db) => setDoc(doc(db, 'blacklist/stu1'), { reason: 'test' }))
  await assertFails(getDoc(doc(ctx('stu1', 's1@x.com'), 'courses/c1')))
  await seed((db) => setDoc(doc(db, 'blacklist/admA'), { reason: 'test' }))
  await assertFails(getDoc(doc(ctx('admA', 'a@x.com'), 'users/stu1')))
})
test('blacklisted user cannot re-create a deleted profile', async () => {
  await seed(async (db) => { await deleteDoc(doc(db, 'users/stu1')); await setDoc(doc(db, 'blacklist/stu1'), { reason: 'x' }) })
  await assertFails(setDoc(doc(ctx('stu1', 's1@x.com'), 'users/stu1'), { uid: 'stu1', email: 's1@x.com', role: 'student', status: 'active' }))
})

// ---- config ----
test('only super admin edits site config and stats', async () => {
  await assertFails(setDoc(doc(ctx('admA', 'a@x.com'), 'settings/site_config'), { portalName: 'x' }))
  await assertFails(setDoc(doc(ctx('admA', 'a@x.com'), 'stats/public'), { trainees: 1 }))
  await seed((db) => setDoc(doc(db, 'system/superadmin'), { uid: 'own', email: OWNER }))
  await assertSucceeds(setDoc(doc(ctx('own', OWNER), 'stats/public'), { trainees: 1 }))
  await assertSucceeds(getDoc(doc(anon(), 'stats/public')))
})
