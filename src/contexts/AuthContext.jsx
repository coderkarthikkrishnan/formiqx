import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, provider, db } from '../firebase/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Sync to custom user doc if needed
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            createdAt: serverTimestamp(),
                        });
                    }
                } catch (e) {
                    console.warn("Firestore rules prevented user doc sync. User still authenticated client-side.", e.message);
                }
                let token = localStorage.getItem('fqx_g_token');
                setUser({ ...firebaseUser, googleToken: token });
            } else {
                setUser(null);
                localStorage.removeItem('fqx_g_token');
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            // The signed-in user info
            const user = result.user;

            // Get the Google Access Token for Sheets API
            const credential = GoogleAuthProvider.credentialFromResult(result);
            let augmentedUser = { ...user };

            if (credential && credential.accessToken) {
                // Store temporarily in localStorage so it survives hard refreshes
                // (Firebase doesn't automatically refresh OAuth access tokens for external APIs)
                localStorage.setItem('fqx_g_token', credential.accessToken);
                augmentedUser.googleToken = credential.accessToken;
            }

            setUser(augmentedUser);
            return augmentedUser;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        await signOut(auth);
        localStorage.removeItem('fqx_g_token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {loading ? (
                <div className="loader-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
