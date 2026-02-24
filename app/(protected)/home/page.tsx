import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyTabContent } from "./components/WeeklyTabContent";
import { TodayTabContent } from "./components/TodayTabContent";
import { OverallTabContent } from "./components/OverallTabContent";

export default function Home() {
  return (
    <Tabs defaultValue="today" className="w-full">
      <TabsList className="p-0 rounded-md w-full">
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="weekly">Weekly</TabsTrigger>
        <TabsTrigger value="overall">Overall</TabsTrigger>
      </TabsList>
      <TabsContent value="today">
        <TodayTabContent userId="" />
      </TabsContent>
      <TabsContent value="weekly">
        <WeeklyTabContent />
      </TabsContent>
      <TabsContent value="overall">
        <OverallTabContent />
      </TabsContent>
    </Tabs>
  );
}
