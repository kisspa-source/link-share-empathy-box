import { motion } from "framer-motion";
import FloatingNav from "@/components/layout/FloatingNav";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    Smartphone,
    UploadCloud,
    Zap,
    Globe,
    Share2,
    Lock
} from "lucide-react";

export default function Features() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <FloatingNav />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-landing bg-400% animate-gradient-shift opacity-10" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                            Powerful Features for <br />
                            <span className="text-blue-600">Smart Bookmarking</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                            Experience the most convenient way to manage your digital life.
                            <br className="hidden sm:block" />
                            From one-click saving to seamless sharing.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Main Features */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {/* Convenience */}
                        <motion.div
                            className="bg-card p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Unmatched Convenience</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Save links instantly with our intuitive interface.
                                Organize with tags, folders, and AI-powered categorization
                                that works for you, not against you.
                            </p>
                        </motion.div>

                        {/* Mobile Accessibility */}
                        <motion.div
                            className="bg-card p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                                <Smartphone className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Perfect on Mobile</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Access your world from anywhere. Our responsive design ensures
                                a seamless experience on your phone, tablet, or desktop.
                                Your bookmarks travel with you.
                            </p>
                        </motion.div>

                        {/* Browser Import */}
                        <motion.div
                            className="bg-card p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                                <UploadCloud className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Easy Import</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Switching is effortless. Automatically upload your existing
                                Chrome, Safari, or Edge bookmarks directly into your secure cloud storage.
                                Start organizing in seconds.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Detailed Feature List */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-16">

                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <h3 className="text-3xl font-bold">Public & Private Collections</h3>
                                <p className="text-lg text-muted-foreground">
                                    Create stunning collections to share with the world, or keep your personal research private.
                                    You have total control over who sees what.
                                </p>
                                <ul className="space-y-2 mt-4">
                                    <li className="flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-blue-500" />
                                        <span>Share knowledge with the community</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-blue-500" />
                                        <span>Secure encryption for private links</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="flex-1 bg-muted rounded-xl h-64 flex items-center justify-center text-muted-foreground">
                                <Share2 className="w-16 h-16 opacity-20" />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <h3 className="text-3xl font-bold">Smart Browser Integration</h3>
                                <p className="text-lg text-muted-foreground">
                                    Don't lose your old bookmarks. Use our "Import" feature to bring all your local browser favorites
                                    into one unified, accessible cloud platform.
                                </p>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                        💡 Tip: You can find the "Import" button in your dashboard header after logging in.
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1 bg-muted rounded-xl h-64 flex items-center justify-center text-muted-foreground">
                                <UploadCloud className="w-16 h-16 opacity-20" />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-foreground text-background text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to upgrade your workflow?</h2>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button asChild size="lg" className="rounded-full bg-background text-foreground hover:bg-background/90 text-lg px-8 h-12">
                            <Link to="/signup">Get Started Free</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="rounded-full bg-transparent border-background/20 text-background hover:bg-background/10 text-lg px-8 h-12">
                            <Link to="/login">Login</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
