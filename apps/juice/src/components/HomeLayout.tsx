interface HomeLayoutProps {
  children: React.ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {
  return <div className="flex flex-col gap-6">{children}</div>;
}
