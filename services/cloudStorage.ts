import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    setDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { SleepEntry } from "../types/sleep";

export async function deleteAllUserEntries(userId: string) {
  const colRef = collection(db, "users", userId, "entries");
  const snapshot = await getDocs(colRef);
  const deletions = snapshot.docs.map((docSnap) =>
    deleteDoc(doc(colRef, docSnap.id)),
  );
  await Promise.all(deletions);
}


export async function pushEntry(userId: string, entry: SleepEntry) {
  const ref = doc(db, "users", userId, "entries", entry.id);
  await setDoc(ref, entry);
}

export async function deleteEntryFromCloud(userId: string, entryId: string) {
  await deleteDoc(doc(db, "users", userId, "entries", entryId));
}

export async function pullEntries(userId: string): Promise<SleepEntry[]> {
  const q = query(
    collection(db, "users", userId, "entries"),
    orderBy("sleepTime", "desc"),
  );
  const snapshot = await getDocs(q);
  const entries: SleepEntry[] = [];
  snapshot.forEach((doc) => entries.push(doc.data() as SleepEntry));
  return entries;
}
