import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// TODO: define schema – see docs/AIRTIME_ROADMAP.md Phase 1.1
export const schema = defineSchema({
    projects: defineTable({
        name: v.string(),
        description: v.string(),
        createdBy: v.id('users'),
    }),
    users: defineTable({
        name: v.string(),
        email: v.string(),
        password: v.string()
    })
});