import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ClearanceRail from "@/components/ui/ClearanceRail";
import PartnerMarquee from "@/components/ui/PartnerMarquee";
import Hero from "@/components/sections/Hero";
import Crisis from "@/components/sections/Crisis";
import Approach from "@/components/sections/Approach";
import Capabilities from "@/components/sections/Capabilities";
import Horizon from "@/components/sections/Horizon";
// import Press from "@/components/sections/Press";
import Mission from "@/components/sections/Mission";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Navbar />
      <ClearanceRail />
      <main>
        <Hero />
        <Crisis />
        {/* Why we exist lands before how it works — the origin is the argument. */}
        <Mission />
        <Approach />
        <Capabilities />
        <Horizon />
        {/* Press & milestones — held back for now. Restoring it also needs its
            nav and footer links uncommented in content.ts. */}
        {/* <Press /> */}
        <PartnerMarquee />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
