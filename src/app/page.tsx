import Link from "next/link"
import { CheckCircle, Shield, Clock, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activePage="home" />

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Validate Insurance Claims with Confidence
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                InsureScan streamlines the insurance claim validation process, reducing fraud and accelerating payouts.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/claims">
                <button className="btn btn-primary flex items-center gap-2 px-8">
                  View Claims
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Link>
              <Link href="/demo">
                <button className="btn btn-outline px-8">Request Demo</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">Key Features</h2>
              <p className="mx-auto max-w-[600px] text-gray-500 md:text-lg">
                Our platform offers powerful tools to simplify the insurance claim validation process.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-8">
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="rounded-full bg-gray-100 p-2">
                <CheckCircle className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold">Instant Verification</h3>
              <p className="text-center text-gray-500">
                Validate claims in seconds with our advanced AI-powered verification system.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="rounded-full bg-gray-100 p-2">
                <Shield className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold">Fraud Detection</h3>
              <p className="text-center text-gray-500">
                Identify potentially fraudulent claims with our sophisticated detection algorithms.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="rounded-full bg-gray-100 p-2">
                <Clock className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold">Fast Processing</h3>
              <p className="text-center text-gray-500">
                Reduce claim processing time by up to 80% with our streamlined workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full py-12 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">How It Works</h2>
              <p className="mx-auto max-w-[600px] text-gray-500 md:text-lg">
                Our simple three-step process makes claim validation effortless.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-8">
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">1</div>
              <h3 className="text-xl font-bold">Submit</h3>
              <p className="text-center text-gray-500">Upload claim documents through our secure portal.</p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">2</div>
              <h3 className="text-xl font-bold">Scan</h3>
              <p className="text-center text-gray-500">
                Our system automatically scans and validates the claim information.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">3</div>
              <h3 className="text-xl font-bold">Approve</h3>
              <p className="text-center text-gray-500">
                Receive validation results and process approved claims quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 bg-black text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">
                Ready to streamline your claims process?
              </h2>
              <p className="mx-auto max-w-[600px] md:text-lg">
                Join thousands of insurance professionals who trust InsureScan.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/claims">
                <button className="bg-white text-black px-8 py-2 rounded-md font-medium hover:bg-gray-100">
                  View Claims
                </button>
              </Link>
              <Link href="/signup">
                <button className="border border-white bg-transparent text-white px-8 py-2 rounded-md font-medium hover:bg-white hover:text-black">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
