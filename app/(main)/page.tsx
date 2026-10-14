import { ContactModal } from '@/components/CRM/client-360/ContactModal';
import Automation from '@/components/site/Automation';
import Contact from '@/components/site/Contact';
import DailyView from '@/components/site/DailyView';
import DashboardPreview from '@/components/site/DashboardPreview';
import FAQ from '@/components/site/FAQ';
import Features from '@/components/site/Features';
import Footer from '@/components/site/Footer';
import FreeOffer from '@/components/site/FreeOffer';
import Hero from '@/components/site/Hero';
import HowItWorks from '@/components/site/HowItWorks';
import InsideTender from '@/components/site/InsideTender';
import MobileSection from '@/components/site/MobileSection';
import ProductViews from '@/components/site/ProductViews';
import ShowTheWork from '@/components/site/ShowTheWork';
import SiteHeader from '@/components/site/SiteHeader';
import TeamsAndReminders from '@/components/site/TeamsAndReminders';
import React from 'react';

const page = () => {
    return (
        <div>
            <SiteHeader />
            <Hero />
            <DashboardPreview />
            <Features />
            <ProductViews />
            <Automation />
            <InsideTender />
            <ShowTheWork />
            <TeamsAndReminders />
            <MobileSection />
            <HowItWorks />
            <DailyView />
            <FreeOffer />
            <FAQ />
            <Contact />
            <Footer />
        </div>
    );
};

export default page;