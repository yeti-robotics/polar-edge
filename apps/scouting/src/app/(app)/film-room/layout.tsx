export default function FilmRoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 top-(--header-height) bottom-0 z-40 overflow-hidden bg-black">
      {children}
    </div>
  );
}
