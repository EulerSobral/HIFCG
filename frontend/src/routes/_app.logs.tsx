import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_app/logs")({
  head: () => ({ meta: [{ title: "Logs · HIFCG" }] }),
  component: Page,
});

function Page() {
  const logs = useStore((s) => s.logs);
  return (
    <div>
      <PageHeader title="Registros de uso (logs)" description="Histórico de ações no sistema (RF34)." />
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>Usuário</TableHead><TableHead>Ação</TableHead><TableHead>Detalhe</TableHead></TableRow></TableHeader>
          <TableBody>
            {logs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sem registros.</TableCell></TableRow>}
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">{new Date(l.timestamp).toLocaleString("pt-BR")}</TableCell>
                <TableCell>{l.userName}</TableCell>
                <TableCell className="font-mono text-xs">{l.acao}</TableCell>
                <TableCell className="text-muted-foreground">{l.detalhe}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}