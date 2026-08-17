import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ClearanceRail from "@/components/ui/ClearanceRail";
import PartnerMarquee from "@/components/ui/PartnerMarquee";
import Hero from "@/components/sections/Hero";
import Crisis from "@/components/sections/Crisis";
import Approach from "@/components/sections/Approach";
import Technology from "@/components/sections/Technology";
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
        {/* What the company builds comes before any one thing it is built into.
            Crisis and Approach are the ClearLandMine block — the one programme
            discussed in the open — and Mission closes it by saying why. */}
        <Technology />
        <Crisis />
        <Approach />
        <Mission />
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
