import { AppShell } from "@/features/shell/AppShell";
import { WebtoonSheetProvider } from "@/features/shell/WebtoonSheetContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <WebtoonSheetProvider>{children}</WebtoonSheetProvider>
    </AppShell>
  );
}
