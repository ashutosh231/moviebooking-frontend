import React from 'react';
import { contactStyles } from '../assets/dummyStyles';
import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { MessageCircle,Phone, Ticket,Send, Popcorn,Mail, MapPin } from 'lucide-react';
const ContactPage = () => {
    const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Only allow digits for phone and limit to 10 chars
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digits }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate phone is exactly 10 digits
    if (!formData.phone || formData.phone.length !== 10) {
      toast.error('⚠️ Please enter a valid 10-digit phone number.');
      console.warn('Submit blocked - invalid phone:', formData.phone);
      return;
    }

    // Format the message for WhatsApp
    const whatsappMessage = `Name: ${encodeURIComponent(formData.name)}%0AEmail: ${encodeURIComponent(formData.email)}%0APhone: ${encodeURIComponent(formData.phone)}%0ASubject: ${encodeURIComponent(formData.subject)}%0AMessage: ${encodeURIComponent(formData.message)}`;

    // Open WhatsApp with pre-filled message
    window.open(`https://wa.me/8082520347?text=${whatsappMessage}`, '_blank');
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
    toast.success('Message is being sent via WhatsApp!');
  };
  return (
    <div className={contactStyles.pageContainer}>
        <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div className={contactStyles.bgGradient}></div>
      <div className={contactStyles.bgBlob1}></div>
      <div className={contactStyles.bgBlob2}></div>

      {/* Film strip effect */}
      <div className={contactStyles.filmStripTop}>
        {[...Array(20)].map((_, i) => (
          <div key={i} className={contactStyles.filmStripSegment}></div>
        ))}
      </div>
      <div className={contactStyles.filmStripBottom}>
        {[...Array(20)].map((_, i) => (
          <div key={i} className={contactStyles.filmStripSegment}></div>
        ))}
      </div>
        <div className={contactStyles.contentContainer}>
            <div className={contactStyles.headerContainer}>
                <div className="inline-flex items-center justify-center mb-4">
                    <h1 className={contactStyles.headerTitle}>
                        <span className={contactStyles.headerTitleRed}>Contact</span>
                        <span className={contactStyles.headerTitleWhite}>Us</span>
                    </h1>
                    </div>
                    <p className={contactStyles.headerSubtitle}>
                        Have questions about movie bookings or special events? Our team is here to help you.
                    </p>
                

            </div>

            <div className={contactStyles.gridContainer}>
                <div className={contactStyles.cardRelative}>
                    <div className={contactStyles.cardGradient}></div>
                        <div className={contactStyles.cardContainer}>
                            <div className={contactStyles.cardBadge}>
                                <Ticket className={contactStyles.cardIcon} />
                                BOOKING SUPPORT
                            </div>
                            <h2 className={contactStyles.formTitle}>
                                <MessageCircle className={contactStyles.formTitleIcon} />
                                Send us a message
                            </h2>
                            <form onSubmit={handleSubmit} className={contactStyles.form}>
                                <div className={contactStyles.formGrid}>
                                    <div>
                                        <label htmlFor="name" className={contactStyles.inputGroup}>
                                            Full Name *
                                        </label>
                                        <input type="text" id="name" name="name" value={formData.name}
                                         onChange={handleChange} className={contactStyles.input} placeholder='Your Name' required />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className={contactStyles.inputGroup}>
                                            Email Address *
                                        </label>
                                        <input type="email" id="email" name="email" value={formData.email}
                                         onChange={handleChange} className={contactStyles.input} placeholder='your@example.com' required />
                                    </div>

                                </div>
                                <div>
                                        <label htmlFor="phone" className={contactStyles.inputGroup}>
                                            Phone Number *
                                        </label>
                                        <input type="tel" id="phone" name="phone" value={formData.phone} title="Enter a valid 10-digit phone number"
                                         onChange={handleChange} className={contactStyles.input} inputMode='numeric' pattern='[0-9]{10}' maxLength={10} placeholder='Your phone number' required />
                                </div>
                                <div>
                  <label htmlFor="subject" className={contactStyles.inputGroup}>
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={contactStyles.select}
                  >
                    <option value="">Select a subject</option>
                    <option value="Ticket Booking">Ticket Booking</option>
                    <option value="Group Events">Group Events</option>
                    <option value="Membership">Membership Inquiry</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Refund">Refund Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                    <label htmlFor="message" className={contactStyles.inputGroup}>
                                            Message *
                    </label>
                    <textarea name="message" id="message" value={formData.message} onChange={handleChange} required rows='4' placeholder='Please describe your inquiry in details...' className={contactStyles.textarea}>

                    </textarea>

                </div>
                <button type="submit" className={contactStyles.submitButton}>
                    Send via WhatsApp
                    <Send className={contactStyles.buttonIcon}  />
                </button>

                            </form>
                        </div>
                    </div>
                    <div className="space-y-6 ">
                        <div className={contactStyles.cardRelative}>
                            <div className={contactStyles.cardGradient}></div>
                                <div className={contactStyles.cardContainer}>
                                    <div className={contactStyles.cardBadge}>
                                        <Popcorn className={contactStyles.cardIcon} />
                                        CINEMA INFO
                                    </div>
                                    <h2 className={contactStyles.formTitle}>Contact Information</h2>
                                    <div className={contactStyles.contactInfo}>
                                      <div className={contactStyles.contactItem}>
                                        <div className={contactStyles.contactIconContainer}>
                                          <Phone className={contactStyles.contactIcon} />
                                        </div>
                                        <div>
                                            <h3 className={contactStyles.contactText}>Booking Hotline</h3>
                                            <p className={contactStyles.contactDetail}>+91 9876543210</p>
                                        </div>
                                      </div>
                                      <div className={contactStyles.contactItem}>
                                        <div className={contactStyles.contactIconContainer}>
                                          <Mail className={contactStyles.contactIcon} />
                                        </div>
                                        <div>
                                            <h3 className={contactStyles.contactText}>Email Address</h3>
                                            <p className={contactStyles.contactDetail}>booking@cineplex.com</p>
                                            <p className={contactStyles.contactDetail}>support@cineplex.com</p>
                                        </div>
                                      </div>

                                       <div className={contactStyles.contactItem}>
                                        <div className={contactStyles.contactIconContainer}>
                                          <MapPin className={contactStyles.contactIcon} />
                                        </div>
                                        <div>
                                            <h3 className={contactStyles.contactText}>Main Theater Location</h3>
                                            <p className={contactStyles.contactDetail}>123 Cinema Street, Film City, Mumbai, FC 400001</p>
                                            <p className={contactStyles.contactSubDetail}>+4 other locations across the city</p>
                                        </div>
                                      </div>
                                    </div>
                                </div>
                            
                        </div>
                        {/* Emergency Support Card */}
            <div className={contactStyles.cardRelative}>
              <div className={contactStyles.emergencyCardGradient}></div>
              <div className={contactStyles.emergencyCard}>
                <h3 className={contactStyles.emergencyTitle}>
                  <Phone className={contactStyles.emergencyIcon} />
                  Urgent Show-Related Issues
                </h3>
                <p className={contactStyles.emergencyText}>
                  For urgent issues during a movie screening (sound, projection, etc.)
                </p>
                <div className="flex items-center">
                  <div className={contactStyles.emergencyHotline}>
                    HOTLINE: +91 8299431275
                  </div>
                  <span className={contactStyles.emergencyNote}>Available during showtimes</span>
                </div>
              </div>
            </div>
                    </div>
            </div>
        </div>
    </div>
    
  );
};

export default ContactPage;