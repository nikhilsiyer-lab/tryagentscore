import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AgentScore - Demo Sandbox',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
