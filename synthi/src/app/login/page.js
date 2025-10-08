'use client';

import { signIn } from 'next-auth/react'; 
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const {data: session, status } = useSession();
  const router = useRouter();
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <p className="text-xl text-gray-600">Loading session data...</p>
      </div>
    );
  }
  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  if (session) {
    return <p>Redirecting...</p>; 
  }

  const handleGoogleSignIn = () => signIn('google');
  const handleGitHubSignIn = () => signIn('github');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-800">Sign In</h1>
        
        <p className="text-center text-sm text-gray-500">
          Sign in to your account using one of the providers below.
        </p>

        <div className="space-y-4">
          <button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150"
          >
            <FcGoogle className="h-5 w-5" />
            <span>Continue with Google</span>
          </button>

          <button 
            onClick={handleGitHubSignIn}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 transition duration-150"
          >
            <FaGithub className="h-5 w-5" />
            <span>Continue with GitHub</span>
          </button>
        </div>

      </div>
    </div>
  );
}
