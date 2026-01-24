import {PricingTable} from "@clerk/clerk-react";
import {Loader2} from "lucide-react";

interface PricingSectionProps {
    compact?: boolean
}


    export default function PricingSection({ compact }: PricingSectionProps) {
        return (
            <section className={'relative py-26 md:py-34 overflow-hidden'}>
                <div className={'max-w-7xl mx-auto'}>
                    {/* Header */}
                    <div className={'text-center mb-20'}>
                        <h2 className={'text-5xl md:text-6xl font-bold mb-7'}>
                            Simple,<span className={'gradient-emerald-text'}>Transparent</span>Pricing
                        </h2>
                        <p className={'text-xl md:text-2xl text-gray-800 max-w-3xl mx-auto leading-relaxed'}>
                            Choose the plan that fits your podcasting needs. No hidden fees, no surprises.
                        </p>
                    </div>

                    {/* Pricing  */}
                    <div className={`flex justify-center w-full ${compact ? 'max-w-4xl' : 'max-w-5xl'}`}>
                        <div className={compact ? 'max-w-4xl w-full' : 'max-w-5xl w-full'}>
                            <PricingTable
                                appearance={{
                                    elements:{
                                        pricingTableCardHeader:{
                                            background:'linear-gradient(90deg, #10B981, #3B82F6)',
                                            color:'white',
                                            borderRadius:'1rem 1rem 0 0 ',
                                            padding:compact ? '2rem':'3.5rem',
                                        },
                                        pricingTableCardTitle: {
                                            fontSize: compact ? "1.75rem" : "2.25rem",
                                            fontWeight: "800",
                                            color: "white",
                                            marginBottom: "0.5rem",
                                        },
                                        pricingTableCardDescription: {
                                            fontSize: compact ? "0.95rem" : "1.1rem",
                                            color: "rgba(255, 255, 255, 0.95)",
                                            fontWeight: "500",
                                        },
                                        pricingTableCardFee: {
                                            color: "white",
                                            fontWeight: "800",
                                            fontSize: compact ? "2.5rem" : "3rem",
                                        },
                                        pricingTableCardFeePeriod: {
                                            color: "rgba(255, 255, 255, 0.85)",
                                            fontSize: "1.1rem",
                                        },
                                        pricingTableCard: {
                                            borderRadius: "1rem",
                                            border: "2px solid rgb(16 185 129 / 0.2)",
                                            boxShadow: "0 10px 40px rgba(16, 185, 129, 0.15)",
                                            transition: "all 0.3s ease",
                                            overflow: "hidden",
                                            background: "rgba(255, 255, 255, 0.9)",
                                            backdropFilter: "blur(10px)",
                                        },
                                        pricingTableCardBody: {
                                            padding: compact ? "2rem" : "2.5rem",
                                        },
                                        pricingTableCardFeatures: {
                                            marginTop: "2rem",
                                            gap: "1rem",
                                        },
                                        pricingTableCardFeature: {
                                            fontSize: compact ? "0.95rem" : "1.05rem",
                                            padding: "0.75rem 0",
                                            fontWeight: "500",
                                        },
                                        pricingTableCardButton: {
                                            marginTop: "2rem",
                                            borderRadius: "0.75rem",
                                            fontWeight: "700",
                                            padding: "1rem 2.5rem",
                                            transition: "all 0.2s ease",
                                            fontSize: "1.1rem",
                                            background: "linear-gradient(135deg, rgb(16 185 129), rgb(45 212 191))",
                                            border: "none",
                                            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                                        },
                                    },
                                }}
                                fallback={
                                    <div className={'flex items-center justify-center py-20'}>
                                        <div className={'text-center space-y-4 glass-card p-12 rounded-2xl'}>
                                            <Loader2 className={'h-16 w-16 animate-spin text-emerald-600 mx-auto'} />
                                            <p className={'text-gray-800 text-lg font-medium'}>Loading pricing Options...</p>
                                        </div>
                                    </div>
                                }
                            />
                        </div>
                    </div>
                </div>
            </section>
        );
    };

