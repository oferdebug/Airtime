import { EventSchemas, Inngest } from 'inngest';

// Create a client to send and receive events
type Events = {
  'test/hello.world': {
    data: {
      email: string;
    };
  };
  'podcast/uploaded': {
    data: {
      projectId: string;
      userId: string;
      plan: 'free' | 'pro' | 'ultra';
      fileUrl: string;
      fileName: string;
      fileSize: number;
      fileDuration?: number;
      fileFormat: string;
      mimeType: string;
    };
  };
  'podcast/retry-job': {
    data: {
      projectId: string;
      job: string;
      userId: string;
      originalPlan: 'free' | 'pro' | 'ultra';
      currentPlan: 'free' | 'pro' | 'ultra';
    };
  };
};

export const inngest = new Inngest({
  id: 'Airtime',
  schemas: new EventSchemas().fromRecord<Events>(),
});
