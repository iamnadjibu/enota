import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, MessageCircle, Mail, MapPin, CheckCircle } from 'lucide-react'
import PublicLayout from '../../layouts/PublicLayout'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
}

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    regNumber: '',
    message: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 5000)
  }

  const handleWhatsApp = () => {
    const text = `Hello NAD Production, I am ${formData.firstName} ${formData.lastName} (${formData.regNumber}).\n\n${formData.message}`
    window.open(`https://wa.me/250786487234?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  const handleEmail = () => {
    const subject = `eNOTA Inquiry from ${formData.firstName} ${formData.lastName}`
    const body = `${formData.message}\n\nReg Number: ${formData.regNumber}`
    window.location.href = `mailto:inkhub250@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid lg:grid-cols-2 gap-20 items-stretch">
          <motion.div {...fadeInUp} className="flex flex-col h-full bg-surface border border-white/5 rounded-[40px] p-10 lg:p-16">
            <h1 className="text-4xl md:text-6xl font-display font-extrabold mb-8 tracking-tighter">Get In <span className="text-accent">Touch</span></h1>
            <p className="text-lg text-muted mb-12 max-w-sm">Have any questions about the eNOTA system? Send us a message and we'll get back to you shortly.</p>

            <div className="space-y-10 flex-grow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-accent shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white/80 mb-1">Email Us</h4>
                  <p className="text-sm text-muted">inkhub250@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-accent shrink-0">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white/80 mb-1">WhatsApp</h4>
                  <p className="text-sm text-muted">+250786487234</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-accent shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white/80 mb-1">Location</h4>
                  <p className="text-sm text-muted">Kigali, Rwanda</p>
                </div>
              </div>
            </div>

            <div className="mt-20 flex gap-4">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse delay-150"></div>
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse delay-300"></div>
            </div>
          </motion.div>

          <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="glass p-10 lg:p-16 rounded-[40px] border border-white/5">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label htmlFor="c-first" className="field-label">First name</label>
                  <input id="c-first" 
                    type="text" 
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="John" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="c-last" className="field-label">Last name</label>
                  <input id="c-last" 
                    type="text" 
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Doe" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label htmlFor="c-email" className="field-label">Email</label>
                  <input id="c-email" 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="johndoe@email.com" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="c-reg" className="field-label">Registration number</label>
                  <input id="c-reg" 
                    type="text" 
                    required
                    value={formData.regNumber}
                    onChange={(e) => setFormData({...formData, regNumber: e.target.value})}
                    placeholder="e.g. KSP0101998" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="c-msg" className="field-label">Message</label>
                <textarea id="c-msg" 
                  rows="5"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="How can we help you today?" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent transition-colors resize-none"
                ></textarea>
              </div>

              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-accent/10 border border-accent/20 p-6 rounded-2xl text-accent flex items-center justify-center gap-3 font-bold"
                >
                  <CheckCircle size={24} /> Message Sent Successfully!
                </motion.div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={handleWhatsApp}
                    className="btn-outline flex items-center justify-center gap-2 hover:bg-accent/5 hover:border-accent/40"
                  >
                    <MessageCircle size={20} /> Send via WhatsApp
                  </button>
                  <button 
                    type="button"
                    onClick={handleEmail}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <Send size={20} /> Send via Email
                  </button>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  )
}
