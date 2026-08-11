import { auth } from "@/firebaseConfig"; 
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  User,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  profile: { name: string; email: string; photo: string } | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    photo: string;
  } | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "210765465869-3nqugstugo9mep0o6nv9scu0ia0sohbd.apps.googleusercontent.com",
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setProfile({
          name: firebaseUser.displayName || "Sleep User",
          email: firebaseUser.email || "",
          photo: firebaseUser.photoURL || "",
        });
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setAuthLoading(true);
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const result = await GoogleSignin.signIn();

      if (result.type !== "success") {
        throw new Error("Sign-in was cancelled or failed");
      }

      const idToken = result.data.idToken;
      if (!idToken) {
        throw new Error("No ID token returned from Google");
      }

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);

      console.log("✅ Signed in successfully");
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      setAuthLoading(true);
      await GoogleSignin.signOut();
      await auth.signOut();
    } catch (error) {
      // …
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, signInWithGoogle, authLoading, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
