import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyTabContent } from "./components/WeeklyTabContent";
import { TodayTabContent } from "./components/TodayTabContent";

export default function Home() {
  return (
    <Tabs defaultValue="today" className="w-full">
      <TabsList className="p-0 rounded-md w-full">
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="weekly">Weekly</TabsTrigger>
        <TabsTrigger value="overall">Overall</TabsTrigger>
      </TabsList>
      <TabsContent value="today">
        <TodayTabContent />
      </TabsContent>
      <TabsContent value="weekly">
        <WeeklyTabContent />
      </TabsContent>
      <TabsContent value="overall">
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              Generate and download your detailed reports. Export data in
              multiple formats for analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            You have 5 reports ready and available to export.
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
