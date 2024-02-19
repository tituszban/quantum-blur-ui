import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, Auth, getAdditionalUserInfo, signOut as authSignOut, GithubAuthProvider } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';
import { getStorage, ref, uploadBytes, FirebaseStorage, getDownloadURL, deleteObject, getBlob, listAll, getMetadata } from "firebase/storage";
import { getFirestore, doc, Firestore, collection, addDoc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useQueries } from '@tanstack/react-query';
import { Functions, getFunctions, httpsCallable } from "firebase/functions";
import { useToast } from '@/components/toast/use-toast';

const firebaseConfig = {
    apiKey: "AIzaSyATHYacPTaCwSGH7Jnme0bCFOh9SuKoHUs",
    authDomain: "quantum-blur.firebaseapp.com",
    projectId: "quantum-blur",
    storageBucket: "quantum-blur.appspot.com",
    // messagingSenderId: "478601168516",
    appId: "1:478601168516:web:9e85ec719122d6cc98e4d1",
    measurementId: "G-16TEVEB2TZ",
    functionRegion: "europe-west1"
};

interface IFirebaseContext {
    app: FirebaseApp;
    auth: Auth;
    storage: FirebaseStorage;
    firestore: Firestore;
    functions: Functions;
}

const FirebaseContext = createContext<IFirebaseContext | null>(null);

interface Props {
    children: React.ReactNode;
}

export const FirebaseContextProvider: React.FC<Props> = ({ children }) => {
    const app = initializeApp(firebaseConfig);

    const auth = getAuth(app);

    const storage = getStorage(app);

    const firestore = getFirestore(app);

    const functions = getFunctions(app, firebaseConfig.functionRegion);

    return (
        <FirebaseContext.Provider value={{
            app, auth, storage, firestore, functions
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
    const { toast } = useToast();


    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        console.log("Sign in with Google");
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
                toast({
                    title: "Error signing in",
                    description: error.message,
                });
                console.error(error);
            }).finally(() => {
                setSignInLoading(false);
            });
    };

    const signInWithGitHub = () => {
        const provider = new GithubAuthProvider();
        console.log("Sign in with GitHub");
        setSignInLoading(true);
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("AuthResult", result);
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = GithubAuthProvider.credentialFromResult(result);
                if (credential === null) throw new Error("Credential is null");
                console.log("AuthCredentials", credential);

                console.log("AuthAdditionalUserInfo", getAdditionalUserInfo(result));
            }).catch((error) => {
                toast({
                    title: "Error signing in",
                    description: error.message,
                });
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
        signInWithGitHub,
        signOut
    };
};

export interface UploadedFile {
    id: string;
    fileName: string;
    uploaded: boolean;
    type: string;
    size: [number, number] | null;
    url: string | null;
}

export const useFiles = () => {
    const { user } = useAuth();
    const { storage, firestore } = useFirebase();
    const counterRef = useRef<number>();
    const { toast } = useToast();

    if (!user) throw new Error("User is not signed in");

    const filesCollection = collection(firestore, 'users', user.uid, "uploads");

    const docRefForId = (id: string) => doc(firestore, "users", user.uid, "uploads", id);
    const fileRefForId = (id: string) => ref(storage, `userFiles/${user.uid}/${id}`);

    const [value] = useCollection(
        filesCollection,
        {
            snapshotListenOptions: { includeMetadataChanges: true },
        }
    );

    const filesWithUrls = useQueries({
        queries: value?.docs.filter(file => !!file).map(file => ({
            queryKey: ["fileUrl", file.id, file.data().uploaded],
            queryFn: async () => getDownloadURL(fileRefForId(file.id))
        })) ?? []
    });

    const fileDocs: UploadedFile[] = useMemo(() => {
        return value?.docs?.map((file, i) => {
            const data = file.data();
            const withUrl = filesWithUrls[i]?.data;
            return {
                id: file.id,
                fileName: data.fileName,
                uploaded: data.uploaded,
                type: data.type,
                size: (data.sizeX && data.sizeY) ? [data.sizeX as number, data.sizeY as number] as const : null,
                url: data.uploaded ? withUrl : null,
            } as UploadedFile;
        }) ?? [];
    }, [value?.docs, filesWithUrls]);

    const _uploadFile = async (name: string, type: string, file: File | Blob) => {
        const docRef = await addDoc(filesCollection, {
            uploaded: false,
            type: type,
            fileName: name,
        });

        await uploadBytes(fileRefForId(docRef.id), file);

        await updateDoc(docRef, { uploaded: true });
    };

    const uploadFile = async (file: File) => {
        try {
            await _uploadFile(file.name, file.type, file);
        } catch (e) {
            toast({
                title: "Error uploading file",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                description: (e as any)?.message,
            });
        }
    };

    const deleteFile = async (id: string) => {
        try {
            await Promise.all([
                deleteObject(fileRefForId(id)),
                deleteDoc(docRefForId(id)),
            ]);
        } catch (e) {
            toast({
                title: "Error deleting file",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                description: (e as any)?.message,
            });
        }
    };

    const downloadFile = async (fileId: string) => {
        try {
            const file = fileDocs.find(file => file.id === fileId);
            if (!file) { return; }
            const blob = await getBlob(fileRefForId(fileId));

            const url = window.URL.createObjectURL(
                new Blob([blob]),
            );
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                file.fileName,
            );

            // Append to html link element page
            document.body.appendChild(link);

            // Start download
            link.click();

            // Clean up and remove the link
            link.parentNode?.removeChild(link);
        } catch (e) {
            toast({
                title: "Error downloading file",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                description: (e as any)?.message,
            });
        }
    };

    const setupAccountInitialFiles = async () => {
        try {
            const userDoc = doc(firestore, "users", user.uid);
            const docRef = await getDoc(userDoc);
            const v = (counterRef.current ?? 0) + 1;
            counterRef.current = v;
            if (docRef.exists()) {
                return;
            }

            await setDoc(userDoc, {
                displayName: user.displayName,
                email: user.email,
            });
            if (counterRef.current !== v) {
                // Avoid double call race condition
                return;
            }

            console.log("Setting up initial files");
            const sharedFolder = ref(storage, "sharedFiles");
            const sharedFiles = await listAll(sharedFolder);
            await Promise.all(sharedFiles.items.map(async fileRef => {
                const file = await getBlob(fileRef);
                const metadata = await getMetadata(fileRef);
                await _uploadFile(fileRef.name, metadata.contentType ?? "", file);
            }));
        } catch (e) {
            toast({
                title: "Account initialisation failed",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                description: (e as any)?.message,
            });
        }
    };

    return {
        uploadFile,
        deleteFile,
        downloadFile,
        setupAccountInitialFiles,
        files: fileDocs,
    };
};

export const useFunctions = () => {
    const { functions } = useFirebase();
    const quantumBlurCall = httpsCallable(functions, 'on_quantum_blur');
    const quantumRotateCall = httpsCallable(functions, 'on_quantum_rotate');
    const { toast } = useToast();

    const quantumRotate = async (fileId: string, log: boolean = false, fraction: number = 0.25) => {
        try {
            return await quantumRotateCall({ fileId, log, fraction });
        } catch (e) {
            toast({
                title: "Failed to quantum rotate",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                description: (e as any)?.message,
            });
        }
    };

    const quantumBlur = async (fileId: string, log: boolean = false, xi: number = 0.5) => {
        try {
            return await quantumBlurCall({ fileId, log, xi });
        } catch (e) {
            toast({
                title: "Failed to quantum blur",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                description: (e as any)?.message,
            });
        }
    };

    return {
        quantumRotate,
        quantumBlur
    };
};