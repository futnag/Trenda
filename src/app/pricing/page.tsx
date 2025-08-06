import Header from '@/components/common/Header'
import PricingPlans from '@/components/subscription/PricingPlans'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <PricingPlans />
      </main>
    </div>
  )
}