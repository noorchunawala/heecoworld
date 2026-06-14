import Navbar from "@/components/NavBar";
import Hero from "@/components/Hero";
import HeroV2 from "@/components/HeroV2";
import About from "@/components/About";
import MissionVision from "@/components/MissionVision";
import CollaborationStrip from "@/components/CollaborationStrip";
import Stats from "@/components/Stats";
import Industries from "@/components/Industries";
import Process from "@/components/Process";
import FinalCTA from "@/components/FinalCTA";
import EnquiryModal from "@/components/EnquiryModel";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Services from "@/components/Services";
import WhyHeeco from "@/components/WhyHeeco";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroV2 />
       <About />
      <MissionVision />
      <Services />
      <WhyHeeco />
      <CollaborationStrip />
      <Industries />
      <Process />
      <FAQ />
      <FinalCTA />
      <Footer />
      <EnquiryModal />
      <WhatsAppFloat />
    </main>
  );
}