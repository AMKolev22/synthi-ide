'use client'; // This component must be a Client Component to use useSession

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaGoogle, FaGithub, FaSignOutAlt } from 'react-icons/fa';



export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Display a loading state while fetching session data
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <p className="text-xl text-gray-600">Loading session data...</p>
      </div>
    );
  }

  
  if (!session) {
    router.push('/login');
    return null;
  }

  const user = session.user;
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-xl text-center">
        {user.image && (
          <img 
            src={user.image} 
            alt={user.name || 'User'} 
            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-indigo-500 shadow-md"
          />
        )}
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user.name || 'User'}!
        </h1>
        
        <p className="text-lg text-indigo-600 mb-6">
          {user.email}
        </p>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center justify-center space-x-2 w-full bg-red-500 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:bg-red-600 transition duration-150"
        >
          <FaSignOutAlt className="text-xl" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
  
  
}
