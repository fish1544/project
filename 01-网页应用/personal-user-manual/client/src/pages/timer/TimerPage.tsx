import { useState, useCallback } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@client/src/components/ui/tabs';
import TimerTab from './TimerTab';
import ManualTab from './ManualTab';
import HistoryTab from './HistoryTab';

const TimerPage = () => {
  const [activeTab, setActiveTab] = useState('timer');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRecordSaved = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    // Switch to history tab to show the new record
    setActiveTab('history');
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">计时记录</h1>
        <p className="mt-1 text-sm text-gray-500">
          记录每段时间的去向，看清你的时间花在哪里
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-11 p-1 mb-6">
          <TabsTrigger value="timer" className="h-full">
            计时器
          </TabsTrigger>
          <TabsTrigger value="manual" className="h-full">
            手动补录
          </TabsTrigger>
          <TabsTrigger value="history" className="h-full">
            历史记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer">
          <TimerTab onRecordSaved={handleRecordSaved} />
        </TabsContent>

        <TabsContent value="manual">
          <ManualTab onRecordSaved={handleRecordSaved} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimerPage;
