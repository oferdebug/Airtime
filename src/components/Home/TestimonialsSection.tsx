import { Star, Quote } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  image?: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Podcast Host",
    company: "Tech Talk Daily",
    content:
      "Airtime has completely transformed how I manage my podcast content. The AI transcription is incredibly accurate, and the search feature helps me find specific moments instantly. Game changer!",
    rating: 5,
  },
  {
    id: "2",
    name: "Marcus Johnson",
    role: "Content Creator",
    company: "The Daily Grind",
    content:
      "The social post generation feature alone saves me hours every week. I can now focus on creating great content instead of spending time on social media management.",
    rating: 5,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "Media Producer",
    company: "Creative Studios",
    content:
      "As someone who produces multiple podcasts, Airtime's platform makes it easy to manage everything in one place. The key moments feature helps me create highlight reels quickly.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <Quote className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-semibold text-brand-600">
              What Our Users Say
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-slate-950">
            Loved by{" "}
            <span className="gradient-brand-text">Podcast Creators</span>
          </h2>
          <p className="text-xl text-slate-700 max-w-2xl mx-auto">
            Join thousands of creators who are transforming their podcast workflow
            with AI-powered tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="glass-card rounded-2xl p-8 hover-lift group"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed italic">
                "{testimonial.content}"
              </p>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full gradient-brand flex items-center justify-center text-white font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-950">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
