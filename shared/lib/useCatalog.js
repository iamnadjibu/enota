import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from './firebase'
import { normaliseFaculties } from './faculties'

/** Live list of faculties and departments. */
export function useFaculties() {
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => onSnapshot(
    collection(db, 'faculties'),
    snap => { setFaculties(normaliseFaculties(snap.docs.map(d => ({ id: d.id, ...d.data() })))); setLoading(false) },
    () => setLoading(false),
  ), [])
  return { faculties, loading }
}

/** Live list of institutions (names). */
export function useInstitutions() {
  const [institutions, setInstitutions] = useState([])
  useEffect(() => onSnapshot(
    query(collection(db, 'institutions'), orderBy('name')),
    snap => setInstitutions(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    () => {},
  ), [])
  return institutions
}
