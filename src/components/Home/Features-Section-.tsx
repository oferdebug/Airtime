import {BookMarked, FileText, MessageCircle, Mic2, Users, Zap, type LucideIcon} from "lucide-react";

interface Feature {
    id: string
    icon: LucideIcon
    title: string
    description: string
    premium?: boolean
}

export function FeaturesSection() {
    const features: Feature[] = [
        {
            id: 'realtime-transcription',
            icon: Mic2,
            title: 'Real-Time Transcription',
            description: 'Transcribe your audio in real-time with our advanced AI model.'
        },
        {
            id: 'semantic-search',
            icon: FileText,
            title: 'Semantic Search',
            description: 'Search for specific moments within an episode using semantic text search.'
        },
        {
            id: 'social-posts',
            icon: MessageCircle,
            title: 'AI-Generated Social Posts',
            description: 'Generate social posts for your podcast using AI.'
        },
        {
            id: 'key-moments',
            icon: BookMarked,
            title: 'Key Moments',
            description: 'Identify key moments in your podcast using AI.'
        },
        {
            id: 'key-moments-chapters',
            icon: Zap,
            title: 'Key Moments & Chapters',
            description: 'Generate key moments and chapters for your podcast using AI.'
        },
        {
            id: 'speaker-dialogue',
            icon: Users,
            title: 'Speaker Dialogue',
            description: 'Full transcript with speaker identification - see exactly who said what and when (ULTRA only).',
            premium: true,
        },
        {
            id: 'premium-audio-player',
            icon: Users,
            title: 'Premium Audio Player',
            description: 'A custom-built, minimalist player with dynamic waveform visualization.',
            premium: true,
        },
    ];
    return (
        <section className='container mx-auto px-6 py-26 md:py-34'>
            <div className={'max-w-7xl mx-auto'}>
                <div className={'text-center mb-18'}>
                    <h2 className={'text-5xl md:text-6xl font-bold mb-4'}>
                        Every Feature You Need in {' '}
                        <span className={'gradient-emerald-text'}>One Platform</span> {' '}
                    </h2>
                    <p className={'text-xl text-gray-800 max-w-2xl mx-auto'}>
                        Power up your podcast with AI-driven transcription, search, and social media automation.
                    </p>
                </div>
                <div className={'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10'}>
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.id}
                                className={'glass-card rounded-2xl hover-lift p-8 group'}
                                style={{animationDelay: `${index * 100}ms`}}
                            >
                                <div className={'rounded-2xl gradient-emerald p-4 w-fit mb-6 group-hover:animate-pulse-emerald transition-all'}>
                                    <Icon className={'h-8 w-8 text-white'} />
                                </div>
                                <h3 className={'text-2xl font-bold mb-3 group-hover:text-emerald-700 transition-colors'}>
                                    {feature.title}
                                </h3>
                                <p className={'text-gray-700 leading-relaxed'}>
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection
