import { Palette, Image as ImageIcon, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion, useInView } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const featuresRef = useRef(null);
  const galleryRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const galleryInView = useInView(galleryRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-cream-100 px-4 py-16 md:py-0 overflow-hidden">
        {/* Parallax Background */}
        <motion.div 
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=2400"
            alt="ChartedArt Background"
            className="object-cover w-full h-full opacity-20"
          />
        </motion.div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Staggered Headline */}
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal-300 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            Transform Your Photos into
            <motion.span 
              className="text-sage-400 block mt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              ChartedArt
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-charcoal-300 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            Create your own personalized ChartedArt kit from any photo. Perfect for beginners and art enthusiasts alike.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {isAuthenticated ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link
                  to="/create"
                  className="inline-block bg-sage-400 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg text-lg font-semibold hover:bg-sage-500 transition-colors shadow-lg hover:shadow-xl"
                >
                  Create Your Kit
                </Link>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link
                  to="/auth/login"
                  className="inline-block bg-sage-400 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg text-lg font-semibold hover:bg-sage-500 transition-colors shadow-lg hover:shadow-xl"
                >
                  Sign In to Get Started
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section - Show for all visitors */}
      <section ref={featuresRef} className="py-16 md:py-20 bg-cream-50 px-4">
            <div className="max-w-7xl mx-auto">
              <motion.h2 
                className="text-2xl md:text-3xl font-bold text-center text-charcoal-300 mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                How It Works
              </motion.h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { icon: ImageIcon, title: "Upload Your Photo", desc: "Choose any photo to transform into a ChartedArt masterpiece", delay: 0.1 },
                  { icon: Palette, title: "Customize Your Kit", desc: "Select your preferred size and frame options", delay: 0.2 },
                  { icon: Star, title: "Create & Share", desc: "Paint your masterpiece and share it in our gallery", delay: 0.3 }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="text-center p-6"
                    initial={{ opacity: 0, y: 30 }}
                    animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.6, delay: item.delay, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.div 
                      className="w-16 h-16 mx-auto mb-4 bg-sage-100 rounded-full flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      <item.icon className="w-8 h-8 text-sage-400" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-charcoal-300">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
      </section>

      {/* Gallery Preview - Show for all visitors */}
      <section ref={galleryRef} className="py-16 md:py-20 bg-white px-4">
            <div className="max-w-7xl mx-auto">
              <motion.h2 
                className="text-2xl md:text-3xl font-bold text-center text-charcoal-300 mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={galleryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                Featured Artworks
              </motion.h2>
              <div className="grid md:grid-cols-3 gap-4 md:gap-8">
                {[
                  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
                  "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800",
                  "https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=800"
                ].map((src, index) => (
                  <motion.div 
                    key={index} 
                    className="relative aspect-square overflow-hidden rounded-lg"
                    initial={{ opacity: 0, y: 40 }}
                    animate={galleryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                    transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.05, y: -8 }}
                  >
                    <img
                      src={src}
                      alt={`Featured Artwork ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-charcoal-300/20 to-transparent opacity-0"
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                ))}
              </div>
              <motion.div 
                className="text-center mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={galleryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Link
                    to="/gallery"
                    className="inline-block border-2 border-sage-400 text-sage-400 px-6 md:px-8 py-3 rounded-lg text-lg font-semibold hover:bg-sage-400 hover:text-white transition-colors"
                  >
                    View Gallery
                  </Link>
                </motion.div>
              </motion.div>
            </div>
      </section>

      {/* Call to Action - Show for non-authenticated users */}
      {!isAuthenticated && (
        <section className="py-16 md:py-20 bg-sage-50 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-charcoal-300 mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              Ready to Create Your Masterpiece?
            </motion.h2>
            <motion.p
              className="text-lg md:text-xl text-charcoal-300 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              Join ChartedArt today and transform your favorite photos into beautiful paint-by-numbers kits.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link
                  to="/auth/signup"
                  className="inline-block bg-sage-400 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-sage-500 transition-colors shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}
    </>
  );
}
