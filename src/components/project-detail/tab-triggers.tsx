import { TabsTrigger } from '@/components/ui/tabs';
import { SelectItem } from '@/components/ui/select';
import type { ProjectTabConfig } from '@/lib/tab-config';

interface TriggerProps {
  tab: ProjectTabConfig;
}

export function MobileTabItem({ tab }: TriggerProps) {
  return <SelectItem value={tab.value}>{tab.label}</SelectItem>;
}

export function DesktopTabTrigger({ tab }: TriggerProps) {
  return (
    <TabsTrigger
      value={tab.value}
      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
    >
      {tab.label}
    </TabsTrigger>
  );
}
