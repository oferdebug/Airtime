"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { HelpCircle } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: "1",
    question: "How accurate is the AI transcription?",
    answer:
      "Our AI transcription uses state-of-the-art speech recognition models with an accuracy rate of 95%+ for clear audio. The accuracy may vary slightly based on audio quality, background noise, accents, and speaking speed. We continuously improve our models to provide the best possible results.",
  },
  {
    id: "2",
    question: "What audio formats do you support?",
    answer:
      "We support all major audio formats including MP3, WAV, M4A, FLAC, OGG, and more. You can upload files up to 2GB in size. For longer podcasts, we recommend using our premium plans which support larger file sizes.",
  },
  {
    id: "3",
    question: "How long does transcription take?",
    answer:
      "Transcription speed depends on the length of your audio file. Typically, we process audio at approximately 1 minute of audio per 10-15 seconds of processing time. A 60-minute podcast usually takes about 10-15 minutes to transcribe completely.",
  },
  {
    id: "4",
    question: "Can I edit transcripts after they're generated?",
    answer:
      "Yes! All transcripts are fully editable. You can correct any errors, add speaker labels, and make any necessary adjustments. Your edits are saved automatically and sync across all features including search and social post generation.",
  },
  {
    id: "5",
    question: "Is my audio data secure and private?",
    answer:
      "Absolutely. We take data security seriously. All audio files are encrypted in transit and at rest. We never share your content with third parties, and you can delete your data at any time. We're SOC 2 compliant and follow industry best practices for data protection.",
  },
  {
    id: "6",
    question: "Can I use Airtime for multiple podcasts?",
    answer:
      "Yes! Our platform supports multiple projects and podcasts. You can organize your content by project, making it easy to manage multiple shows. Premium plans include unlimited projects and storage.",
  },
];

export function FAQSection() {
  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <HelpCircle className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-semibold text-brand-600">
              Frequently Asked Questions
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-slate-950">
            Got{" "}
            <span className="gradient-brand-text">Questions?</span>
          </h2>
          <p className="text-xl text-slate-700 max-w-2xl mx-auto">
            Find answers to common questions about Airtime and how it can help
            transform your podcast workflow.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="glass-card rounded-2xl px-6 border-none"
            >
              <AccordionTrigger className="text-left font-semibold text-slate-950 hover:text-brand-600 py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-700 leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
