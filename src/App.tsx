import { useEffect } from 'react';
import { useAuth } from './hooks/firebase';
import { Button } from '@/components/button';
import AuthenticationPage from './pages/AuthenticationPage';
import DashboardPage from './pages/Dashboard';

function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  useEffect(() => {
    console.log("User", user);
  }, [user]);

  if(loading) {
    return null;
  }

  return (
    <>
      {
        !loading && !user ? (
          <AuthenticationPage />
        ) : (
          <DashboardPage />
        )
      }
    </>

    // <>
    //   <h1>Quantum Blur</h1>
    //   <div className="card">
    //     {loading ? "..." : user ? (
    //       <>
    //         <p>
    //           {`Hello ${user.displayName}`}
    //         </p>
    //         <Button onClick={() => signOut()}>
    //           Sign out
    //         </Button>
    //       </>
    //     ) : (
    //       <Button onClick={() => signInWithGoogle()}>
    //         Sign-in with Google
    //       </Button>
    //     )}
    //   </div>
    // </>
  );
}

export default App;
