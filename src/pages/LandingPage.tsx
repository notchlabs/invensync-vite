import HeroSection from '../components/HeroSection'
import Navbar from '../components/Navbar'
import TrustBar from '../components/TrustBar'
import UseCasesSection from '../components/UseCasesSection'
import ProblemSection from '../components/ProblemSection'
import PricingSection from '../components/PricingSection'
import { FeaturesSection } from '../components/FeaturesSection'
import { FooterCTA } from '../components/FooterCTA'

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <HeroSection />
      <TrustBar />
      <UseCasesSection />
      <FeaturesSection />
      <ProblemSection />
      <PricingSection />
      <FooterCTA />
    </div>
  )
}

export default LandingPage
