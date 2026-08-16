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
  signInError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    photo: string;
  } | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        // "210765465869-3nqugstugo9mep0o6nv9scu0ia0sohbd.apps.googleusercontent.com",
        "210765465869-3nqugstugo9mep0o6nv9scu0ia0sohbd.apps.googleusercontent.com",
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log(
        "🔄 Auth state changed:",
        firebaseUser ? firebaseUser.uid : "null",
      );
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
    console.log("🔵 Google Sign-In started");
    try {
      setSignInError(null);
      setAuthLoading(true);

      console.log("🔵 Checking Play Services...");
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      console.log("✅ Play Services OK");

      console.log("🔵 Calling GoogleSignin.signIn()...");
      const result = await GoogleSignin.signIn();
      console.log("📦 SignIn result data:", result.data);

      if (result.type !== "success") {
        throw new Error("Sign-in was cancelled or failed");
      }

      const idToken = result.data.idToken;
      console.log("🔑 ID Token:", idToken ? "present" : "missing");
      if (!idToken) {
        throw new Error("No ID token returned from Google");
      }

      console.log("🔵 Creating Firebase credential...");
      const credential = GoogleAuthProvider.credential(idToken);

      console.log("🔵 Signing into Firebase...");
      await signInWithCredential(auth, credential);
      console.log("✅ Firebase sign-in successful");

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
      value={{
        user,
        profile,
        signInWithGoogle,
        authLoading,
        logout,
        signInError,
      }}
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
