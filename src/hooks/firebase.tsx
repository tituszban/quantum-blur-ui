import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithPopup, GoogleAuthProvider, Auth, getAdditionalUserInfo, User, signOut as authSignOut } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';

const firebaseConfig = {
    apiKey: "AIzaSyATHYacPTaCwSGH7Jnme0bCFOh9SuKoHUs",
    authDomain: "quantum-blur.firebaseapp.com",
    projectId: "quantum-blur",
    storageBucket: "quantum-blur.appspot.com",
    messagingSenderId: "478601168516",
    appId: "1:478601168516:web:9e85ec719122d6cc98e4d1",
    measurementId: "G-16TEVEB2TZ"
};

interface IFirebaseContext {
    app: FirebaseApp;
    auth: Auth;
}

const FirebaseContext = createContext<IFirebaseContext | null>(null);

interface Props {
    children: React.ReactNode;
}

export const FirebaseContextProvider: React.FC<Props> = ({ children }) => {
    const app = initializeApp(firebaseConfig);

    const auth = getAuth(app);

    return (
        <FirebaseContext.Provider value={{
            app, auth
        }}>
            {children}
        </FirebaseContext.Provider>
    );
};

export const useFirebase = (): IFirebaseContext => {
    const app = useContext(FirebaseContext);
    if (!app) throw new Error("Must call useFirebase from inside FirebaseContext");

    return app;
};

export const useAuth = () => {
    const { auth } = useFirebase();
    const [user, loading, error] = useAuthState(auth);
    const [signInLoading, setSignInLoading] = useState<boolean>(false);


    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        console.log("Sign in");
        setSignInLoading(true);
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("AuthResult", result);
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = GoogleAuthProvider.credentialFromResult(result);
                if (credential === null) throw new Error("Credential is null");
                console.log("AuthCredentials", credential);

                console.log("AuthAdditionalUserInfo", getAdditionalUserInfo(result));
            }).catch((error) => {
                console.error(error);
            }).finally(() => {
                setSignInLoading(false);
            });
    };

    const signOut = () => {
        authSignOut(auth);
    };

    return {
        user,
        loading,
        signInLoading,
        error,
        signInWithGoogle,
        signOut
    };
};