import { redirect } from 'next/navigation';

// Root goes straight into the product (the reference design = the app shell).
// The public landing page lives at /home.
export default function Root() {
  redirect('/dashboard');
}
