import { Button } from "@repo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";

export function TableDemo() {
  return (
    <div className="justify-center">
      <Tabs defaultValue="data" className="w-[400px]">
        <div className="justify-center items-center mt-4 font-mono">
          <TabsList>
            <TabsTrigger value="data"> Scouting Data</TabsTrigger>
            <TabsTrigger value="admin"> Admin Panel </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="data">
          <div className="size-310 mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]"> Team Name </TableHead>
                  <TableHead> Balls Scored </TableHead>
                  <TableHead> Offense or Defense Driven </TableHead>
                  <TableHead className="text-right"> Alliance? </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium"> </TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right"> </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="admin">
          <Button type="submit">Sign in with Discord</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TableDemo;
