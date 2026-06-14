import { redirect } from 'next/navigation';

/**
 * Root page — redirects all visitors to the login page.
 * Authentication is handled by Supabase SSR middleware.
 */
export default function RootPage() {
  redirect('/login');
}
