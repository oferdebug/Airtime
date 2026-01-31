import { EventSchemas, Inngest } from "inngest";

// Create a client to send and receive events
type Events = {
  "test/hello.world": {
    data: {
      email: string;
    };
  };
};

export const inngest = new Inngest({
  id: "Airtime",
  schemas: new EventSchemas().fromRecord<Events>(),
});