import React from 'react'
import { motion } from 'framer-motion'
import { Award, Target, Users, Zap, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicLayout from '../../layouts/PublicLayout'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
}

export default function About() {
  const services = [
    { title: 'Video Production & Filmmaking', desc: 'From compelling promotional campaigns to high-end cinematic storytelling.' },
    { title: 'Web Development', desc: 'Responsive, user-centric, and aesthetically striking websites.' },
    { title: 'Graphic Design', desc: 'Translating brand identity into breathtaking visuals.' },
    { title: 'Digital Marketing', desc: 'Data-driven marketing strategies to amplify your reach.' },
  ]

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <motion.div {...fadeInUp} className="max-w-3xl mb-24">
          <h1 className="text-4xl md:text-6xl font-display font-extrabold mb-8 tracking-tight">About <span className="text-accent">Us</span></h1>
          <p className="text-xl text-white/70 leading-relaxed font-light">
            Welcome to NAD Production. Located in the heart of Rwanda, we are a premier creative and digital agency dedicated to bringing visionary ideas to life.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-20 items-start mb-32">
          <motion.div {...fadeInUp} className="glass p-10 rounded-3xl border border-white/5 space-y-10">
            <div>
              <h2 className="text-2xl font-display font-bold mb-6 text-accent flex items-center gap-3">
                <Target size={24} /> Our Mission
              </h2>
              <p className="text-white/60 leading-relaxed">
                To empower businesses, brands, and creators through innovative digital solutions and world-class production services. We don't just complete projects; we turn bold concepts into digital realities.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold mb-6 text-accent flex items-center gap-3">
                <Award size={24} /> Leadership
              </h2>
              <p className="text-white/60 leading-relaxed">
                Under the dynamic leadership of our Managing and General Director, <span className="text-white font-medium">Nadjibullah Uwabato</span>, NAD Production is driven by a relentless commitment to excellence and innovation.
              </p>
            </div>
          </motion.div>

          <div className="space-y-12">
            <motion.h2 {...fadeInUp} className="text-3xl font-display font-bold tracking-tight">Our Core <span className="text-primary-light">Services</span></motion.h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {services.map((service, idx) => (
                <motion.div 
                   key={service.title}
                   {...fadeInUp}
                   transition={{ delay: idx * 0.1 }}
                   className="p-6 glass rounded-2xl border border-white/5 hover:border-accent/30 transition-all group"
                 >
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:bg-accent group-hover:text-background transition-colors">
                    <CheckCircle2 size={20} />
                  </div>
                  <h4 className="font-bold mb-2 group-hover:text-accent transition-colors">{service.title}</h4>
                  <p className="text-xs text-white/40 leading-relaxed">{service.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <motion.div 
          {...fadeInUp}
          className="relative rounded-[40px] overflow-hidden bg-gradient-to-br from-primary to-background p-12 lg:p-20 text-center"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 blur-[120px] rounded-full -mr-20 -mt-20"></div>
          <motion.h2 
            {...fadeInUp}
            className="text-3xl md:text-5xl font-display font-extrabold mb-8 relative z-10"
          >
            A Relentless Commitment to Excellence
          </motion.h2>
          <p className="text-white/60 max-w-2xl mx-auto mb-12 relative z-10">
            Our team brings a wealth of passion, technical proficiency, and creative ingenuity to every single project we undertake. Whether you are a startup or an established brand, we are here to elevate you.
          </p>
          <Link to="/materials" className="btn-primary relative z-10 px-12 py-4 inline-block">Explore Our Works</Link>
        </motion.div>
      </div>
    </PublicLayout>
  )
}

