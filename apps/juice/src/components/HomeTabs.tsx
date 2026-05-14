interface HomeProps {
	children: React.ReactNode;
}

export function Home({ children }: HomeProps) {
	return <div className="flex flex-col gap-6">{children}</div>;
}
