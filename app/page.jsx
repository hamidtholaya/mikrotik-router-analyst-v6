import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function RootPage() {
  const cookieStore = cookies();
  const session = cookieStore.get('mikrotik_session');

  if (session && session.value) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
