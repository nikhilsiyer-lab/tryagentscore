import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'tryagentscore - Demo Sandbox',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
