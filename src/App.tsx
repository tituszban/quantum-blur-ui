import { useEffect } from 'react';
import { useAuth } from './hooks/firebase';
import AuthenticationPage from './pages/AuthenticationPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log("User", user);
  }, [user]);

  if (loading) {
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
  );
}

export default App;
